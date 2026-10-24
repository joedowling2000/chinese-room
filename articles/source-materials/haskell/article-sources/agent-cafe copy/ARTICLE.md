# Building a Multi-Agent Workflow in Haskell

Multi-agent AI systems—where multiple LLMs collaborate, debate, or coordinate—are becoming increasingly important in production environments. While Python dominates the AI landscape, Haskell offers compelling advantages for building robust agent orchestration systems. This article walks through Agent Cafe, a multi-agent debate system built in Haskell that orchestrates conversations between three AI personas using open-weight models.

## Why Haskell for Multi-Agent Systems?

Haskell's strengths align remarkably well with the challenges of agent orchestration:

**Type Safety Catches Errors at Compile Time.** In a multi-agent system, messages flow between components with specific structures. Haskell's type system ensures that an `A2AMessage` always contains the required fields—you cannot accidentally pass a malformed message:

```haskell
data A2AMessage = A2AMessage
    { msgId     :: Text           -- Unique message identifier
    , sender    :: Text           -- Name of the sending agent
    , recipient :: Text           -- Target agent or "all"
    , content   :: Text           -- The actual message content
    , timestamp :: UTCTime        -- When the message was created
    , msgType   :: MessageType    -- Type of message
    } deriving (Show, Eq, Generic)
```

If you try to construct an `A2AMessage` without all fields, or with the wrong types, the code won't compile. This eliminates an entire class of runtime errors common in dynamically-typed languages.

**Explicit Side Effects.** LLM calls are inherently impure—they involve network I/O and non-deterministic responses. Haskell forces you to be explicit about this through its type system. Compare these two function signatures:

```haskell
-- Pure function: Text in, Text out. No side effects possible.
buildContextPrompt :: Agent -> MessageType -> DebateState -> Text

-- Impure function: The IO wrapper signals this performs side effects
callOllama :: Text -> Text -> [A2AMessage] -> IO (Either String Text)
```

The `IO` in the return type is a promise to the compiler (and to readers) that this function talks to the outside world. You cannot accidentally call an `IO` function from pure code—the type system prevents it.

**Immutable State Management.** Agent conversations require careful state management—tracking message history, round numbers, and conversation context. Haskell's immutable data structures prevent accidental state corruption, while monad transformers like `StateT` provide controlled, explicit state threading.

## Understanding Monads Through IO

Before diving into `StateT`, let's demystify monads. A monad is simply a design pattern for sequencing computations that have some additional context or effect.

Consider the `IO` monad. In Haskell, you cannot perform I/O directly—instead, you describe I/O actions that the runtime executes. The `do` notation lets you sequence these actions:

```haskell
main :: IO ()
main = do
    putStrLn "Starting Agent Cafe..."    -- Action 1: print to console
    args <- getArgs                       -- Action 2: get CLI args, bind to 'args'
    let topic = parseArgs args            -- Pure computation (no IO)
    result <- runDebate topic             -- Action 3: run the debate
    putStrLn "Complete."                  -- Action 4: print completion
```

Each line with `<-` performs an `IO` action and binds the result. The `let` line is pure computation—no `<-` needed. The monad ensures actions execute in order, and the type system guarantees you can't forget to handle the `IO` context.

The key insight: **a monad is just a way to chain operations while carrying some context**. For `IO`, that context is "this interacts with the outside world." For `Maybe`, it's "this might fail." For `State`, it's "this reads/writes some state."

## Managing State with StateT

Agent Cafe needs to track the debate state across multiple agent turns:

```haskell
data DebateState = DebateState
    { topic      :: Text          -- The debate topic
    , messages   :: [A2AMessage]  -- Full conversation history
    , roundNum   :: Int           -- Current round number
    , maxRounds  :: Int           -- Maximum rounds before stopping
    , isFinished :: Bool          -- Whether debate has concluded
    } deriving (Show, Eq)
```

In an imperative language, you'd use a mutable variable. In Haskell, we use `StateT`—a monad transformer that threads state through computations while allowing other effects (like `IO`).

### Defining the Debate Monad

```haskell
type Debate a = StateT DebateState IO a
```

This type alias says: "A `Debate` computation produces a value of type `a`, while carrying `DebateState` and performing `IO` operations." The `StateT` transformer "stacks" state handling on top of `IO`.

### Reading and Modifying State

Within a `Debate` computation, we use `get`, `put`, and `modify`:

```haskell
-- get :: Debate DebateState
-- Returns the current state

-- put :: DebateState -> Debate ()
-- Replaces the entire state

-- modify :: (DebateState -> DebateState) -> Debate ()
-- Applies a function to transform the state
```

Here's how `agentTurn` uses these:

```haskell
agentTurn :: Agent -> MessageType -> Debate ()
agentTurn agent mType = do
    -- Step 1: Read current state
    state <- get
    
    -- Step 2: Print "thinking" message (IO action, lifted into Debate)
    liftIO $ do
        setSGR [SetColor Foreground Dull White]
        TIO.putStrLn $ "... " <> agentName agent <> " is thinking ..."
        setSGR [Reset]
    
    -- Step 3: Call Ollama API (IO action returning A2AMessage)
    msg <- liftIO $ agentRespond agent mType state
    
    -- Step 4: Update state by appending the new message
    modify (\s -> s { messages = messages s ++ [msg] })
    
    -- Step 5: Print the message (IO action)
    liftIO $ printMessage msg
```

The `liftIO` function is crucial—it lifts an `IO` action into the `Debate` monad. Without it, the types wouldn't match: `agentRespond` returns `IO A2AMessage`, but we're inside `Debate`, not `IO`.

### Running the Stateful Computation

To execute a `Debate` computation, we use `runStateT`:

```haskell
main :: IO ()
main = do
    let initialState = emptyDebateState topicText defaultRounds
    
    -- runStateT :: Debate a -> DebateState -> IO (a, DebateState)
    (_, finalState) <- runStateT runDebate initialState
    
    saveTranscript finalState
```

`runStateT` takes a `Debate` action and an initial state, then runs the computation in `IO`, returning both the result and the final state. The state is threaded through every `get`, `put`, and `modify` call automatically.

### The State Threading Visualized

```
Initial State                    After Round 1                   After Round 2
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│ topic: "AI..."  │              │ topic: "AI..."  │              │ topic: "AI..."  │
│ messages: []    │  ──────────► │ messages: [m1,  │  ──────────► │ messages: [m1,  │
│ roundNum: 0     │   runRound   │            m2,  │   runRound   │  m2,m3,m4,m5,m6]│
│ maxRounds: 5    │              │            m3]  │              │ roundNum: 2     │
└─────────────────┘              │ roundNum: 1     │              │ maxRounds: 5    │
                                 └─────────────────┘              └─────────────────┘
```

Each `modify` call produces a new state value—the old state is never mutated. This immutability makes debugging easier: you can log state at any point without worrying about race conditions or side effects.

## Functional Programming Patterns

### Pure Functions and Composition

Functional programming emphasizes building complex behavior from simple, composable functions. Consider how we convert A2A messages to Ollama's chat format:

```haskell
toOllamaMessages :: Text -> [A2AMessage] -> [OllamaMessage]
toOllamaMessages sysPrompt history =
    systemMsg : map toUserOrAssistant history
  where
    systemMsg = OllamaMessage "system" sysPrompt
    
    toUserOrAssistant msg = OllamaMessage
        { role = "user"
        , msgContent = formatMessage msg
        }
    
    formatMessage msg = T.concat
        [ "[", sender msg, "]: "
        , content msg
        ]
```

This function is pure—given the same inputs, it always produces the same output. The `map` function applies `toUserOrAssistant` to each message in the history, transforming the entire list without explicit loops. The `where` clause defines local helper functions, keeping the main logic clean.

### Recursion for Control Flow

Instead of imperative loops, Haskell uses recursion. The debate loop demonstrates this pattern:

```haskell
debateLoop :: Debate ()
debateLoop = do
    state <- get
    
    -- Check termination: run rounds 1-4, then stop (round 5 is P(doom))
    if roundNum state >= (maxRounds state - 1) || isFinished state
        then return ()  -- Base case: exit the recursion
        else do
            runRound      -- Run one round (Philosopher → CEO → Economist)
            debateLoop    -- Recursive call: continue the loop
```

The function checks termination conditions, and if not met, runs a round and calls itself. This recursive structure is idiomatic Haskell—the compiler optimizes tail-recursive calls, making this as efficient as a while loop.

### Pattern Matching for Control Flow

Haskell's pattern matching provides elegant branching. The `buildContextPrompt` function uses it to generate different prompts based on message type:

```haskell
buildContextPrompt :: Agent -> MessageType -> DebateState -> Text
buildContextPrompt agent mType state = case mType of
    PDoomScore -> T.unlines
        [ systemPrompt agent
        , ""
        , "Current debate topic: " <> topic state
        , ""
        , "FINAL ROUND - P(DOOM) ASSESSMENT"
        , ""
        , "Based on the debate so far, provide your P(doom) score."
        , "P(doom) is the probability (0-100%) that AI will cause human extinction."
        , ""
        , "FORMAT YOUR RESPONSE EXACTLY AS:"
        , "P(doom): [X]%"
        , "[Your justification in 100 words or less]"
        ]
    _ -> T.unlines
        [ systemPrompt agent
        , ""
        , "Current debate topic: " <> topic state
        , "Round: " <> T.pack (show (roundNum state + 1)) 
                   <> " of " <> T.pack (show (maxRounds state))
        , ""
        , "IMPORTANT: Your response must be 200 words or less."
        , "Respond in character. Be concise but substantive."
        ]
```

The `case` expression matches on `mType`. If it's `PDoomScore`, we generate the special final-round prompt. The `_` wildcard matches all other message types (Argument, Rebuttal, Analysis).

## Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Main.hs                             │
│  • Parse CLI arguments                                      │
│  • Initialize DebateState                                   │
│  • Run debate via StateT                                    │
│  • Save transcript                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Debate.hs                            │
│  runDebate: masterIntro → debateLoop → pDoomRound           │
│  runRound: philosopher → ceo → economist                    │
│  agentTurn: orchestrates single agent response              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Ollama.hs                            │
│  agentRespond: builds prompt, calls LLM, returns A2AMessage │
│  callOllama: HTTP POST to localhost:11434/api/chat          │
│  buildContextPrompt: constructs system + context prompt     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Protocol.hs                           │
│  JSON serialization for A2A messages                        │
│  JSON-RPC 2.0 wrapper functions                             │
│  Ollama request/response types                              │
└─────────────────────────────────────────────────────────────┘
```

**Session Flow:** The application starts in `Main.hs`, which parses the debate topic from command-line arguments and initializes the state. It then executes `runDebate` using `runStateT`, which threads the `DebateState` through the entire conversation. Each agent turn calls `agentRespond`, which builds a context-aware prompt including all previous messages, sends it to Ollama, and returns a structured `A2AMessage`.

## The A2A Protocol

Agent Cafe implements a simplified Agent-to-Agent (A2A) protocol using JSON-RPC 2.0. Each message carries semantic metadata:

```haskell
data MessageType
    = Argument      -- Initial position
    | Rebuttal      -- Counter-argument
    | Analysis      -- Data-driven examination
    | Moderation    -- Host control messages
    | PDoomScore    -- Probability assessment
```

Messages are wrapped in JSON-RPC for interoperability:

```haskell
toJsonRpc :: A2AMessage -> JsonRpcRequest
toJsonRpc msg = JsonRpcRequest
    { jsonrpc = "2.0"
    , method  = messageTypeToMethod (msgType msg)
    , params  = msg
    , rpcId   = msgId msg
    }
```

This structure enables future extensions—agents could communicate across processes or networks using standard JSON-RPC tooling.

## Open-Weight Models and Hosting

Agent Cafe runs on NVIDIA DGX Spark with 128GB unified memory, using Ollama to serve three quantized open-weight models:

| Agent | Model | Parameters | VRAM |
|-------|-------|------------|------|
| Philosopher | Qwen 2.5 | 32B (Q4_K_M) | ~20GB |
| CEO | Llama 3.1 | 70B (Q4_K_M) | ~43GB |
| Economist | Gemma 2 | 27B (Q4_K_M) | ~18GB |

The Q4_K_M quantization reduces memory footprint by ~75% with minimal quality loss. Ollama manages model loading dynamically—models are loaded on first request and cached in GPU memory.

Each agent's persona is defined declaratively:

```haskell
ceo :: Agent
ceo = Agent
    { agentName = "CEO"
    , agentModel = "llama3.1:70b-instruct-q4_K_M"
    , systemPrompt = ceoPrompt
    }
```

The `buildContextPrompt` function injects the system prompt along with debate context, ensuring each agent responds in character while engaging with previous arguments.

## Conclusion

Haskell's type system, explicit effect handling, and functional patterns provide a solid foundation for multi-agent orchestration. While the ecosystem is smaller than Python's, the guarantees Haskell provides—no null pointer exceptions, no accidental state mutation, compile-time verification of message structures—reduce the debugging burden significantly.

Agent Cafe demonstrates that functional programming isn't just academically interesting—it's practically useful for building reliable AI systems where correctness matters.

*The complete source code is available at [repository link].*
