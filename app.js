const articles = [
  {id:'mindcuber',no:'04',tag:'REINFORCEMENT LEARNING',date:'SEP 2026',read:'18 MIN',title:"AI, a Lego robot and a Rubik's cube",dek:"Building and training a neural network to solve a Rubik's cube, then handing the answer to a Lego Mindstorms robot.",file:'mindcuber.docx',fileLabel:'Download the article (.docx)',sections:[
    {h:'Easy for humans, hard for machines',paras:[
      `Most people can learn to solve a Rubik's cube in a couple of hours. Doing so involves recognising a few key patterns, learning 6 or 7 simple algorithms and practice. Taken to extremes, the global speedcube circuit includes numerous youngsters who can solve a scrambled cube in under 4 seconds, with the current record holder, 9-year-old Teodor Zajder from Poland, clocking 2.76 seconds at an event in February 2026.`,
      `It might be surprising then, to discover that a Rubik's cube falls into a category of problems which is straightforward for humans, but incredibly difficult for a computer that has not been pre-programmed with the required algorithms.`,
      `Why? Because a scrambled Rubik's cube has 4.3 × 10¹⁹ (43 quintillion) possible states. That is an unfathomably large number; it is more than the number of seconds that have passed since the big bang, and more than the number of grains of sand on the earth. If you took a standard sized 3×3 cube in every unique state, you could completely cover the earth 270 times over.`,
      `The focus of this project and article is the neural network, training and most importantly, learning (both machine and personal!), so let's get one of the coolest elements of the project out of the way first.`
    ]},
    {h:'The Lego robot',paras:[
      `The robot in the photo is the incredible creation of David Gilday, an engineer at ARM and robot enthusiast. The build is based on Lego Set 51515 — Mindstorms Robot Inventor, a set which I fortunately bought for my son Henry a few years ago. The instructions provided with the Mindcuber build are good, so the robot was built, calibrated and performing its tricks to the amazement of my family in under 3 hours.`,
      `The base controller runs MicroPython and the mindcuber project includes a neat programme which scans the cube using a colour recognition sensor, computes the required moves to solve, then executes by rotating the cube in a basket, flipping as needed so that the required face can be rotated. The only notable limitation is that the robot can only rotate a single face (the face in the basket).`
    ]},
    {h:'Defining the problem',paras:[
      `With the baseline robot built and tested I could move onto the project itself. In previous projects I have used various models in different ways, but this was my first attempt at creating one from scratch. The intention, apart from being very cool in its own right, is that it is the next logical stepping stone on the learning path to building my own LLM on the DGX Spark.`,
      `The first step is to create structure around the problem. For the Rubik's cube this is straightforward and there are only 3 key things to define: what does the input look like, what does the network need to output, and what does correct mean?`,
      `The input to the network is simple: a current state representation of the cube. A 3×3 Rubik's cube has 6 different colours, 6 faces and 9 stickers per face, this gives 324 values which will act as input to the network. These need to be encoded as numbers and shaped into a tensor. The correct way to do this is using one-hot encoding: each colour is represented as a 6-digit array of zeros and ones.`,
      `Using one-hot is important where all inputs have general equality outside of their single defining attribute. If we used normal denary numbers (1, 2 .. 6) the network may incorrectly think that the colour '6' is more important than the colour '1', or that colour '2' is more like colour '1' than colour '6'.`,
      `Our input tensor is therefore shape: (54, 6). That is, 54 rows (one per sticker), 6 columns (one per possible face), which is then flattened to (324,), a continuous array of 324 values, most of which are 0 and 54 of which are 1.`
    ],code:`def get_state_onehot(self) -> np.ndarray:
    """Return one-hot encoded state (54 positions x 6 colors = 324)."""
    onehot = np.zeros((54, 6), dtype=np.float32)
    flat = self.state.flatten()
    for i, color in enumerate(flat):
        onehot[i, color] = 1.0
    return onehot.flatten()`,lang:'PYTHON',after:`Although the input index of each value always refers to the same physical sticker position, we do not encode any spatial or geometry information. In other words, the network has no idea that the input object is a cube, it must figure that out!`},
    {h:'Two heads: policy and value',paras:[
      `For the output we need 2 things: the next best move and the estimated number of moves remaining until the cube is solved. These are the Policy Head and Value Head respectively.`,
      `There are 12 possible moves on a Rubik's cube. These are normally written as F (turn front face clockwise), F' (front anticlockwise), etc. The Policy Head therefore outputs 12 raw logits. At inference time, these are normalised using softmax as probability scores which add up to 1 — in one sample output, F' and D' came out on top at 22% each, with U at 12% third.`,
      `So our policy head output tensor is shape: (12,). The value head is given as a single value, shape: (1,).`
    ],code:`# Policy head: predicts best move (12 possible moves)
self.policy_head = nn.Sequential(
    nn.Linear(backbone_output_size, 256),
    nn.ReLU(),
    nn.Linear(256, 12)
)

# Value head: predicts distance to solved
self.value_head = nn.Sequential(
    nn.Linear(backbone_output_size, 256),
    nn.ReLU(),
    nn.Linear(256, 1)
)`,lang:'PYTHON'},
    {h:'What does correct mean? — the loss functions',paras:[
      `The final step is to define the loss functions, one each for the value head and policy head. This answers the question about 'what does correct mean?'`,
      `For the value head (number of moves remaining) there are a number of options that would work, but I used mean squared error as the optimum. This is calculated as Value Loss = (predicted_distance − true_distance)². For example, if the network predicts that the solved state is 5 moves away, but the true distance is 8 moves, then the loss = (5 − 8)² = 9. The quadratic function penalises large errors and encourages the network to be more accurate.`,
      `For the policy head, the standard approach for a multi-class classification (the 12 possible moves) is cross-entropy: Policy Loss = −log(probability_of_correct_move). If the correct move is F' and the network predicts F' at 0.22, the loss = −log(0.22) ≈ 1.51. If it had predicted F' at 0.90, loss = −log(0.90) ≈ 0.10 — a much better score. If it had predicted F' at 0.01, loss = −log(0.01) ≈ 4.61 — a terrible score, and the network is unlikely to solve the cube. During training, total loss = value_loss + policy_loss.`
    ]},
    {h:'Choosing an architecture',paras:[
      `Each layer in a neural network is a row of neurons, each of which takes every value from the previous layer, multiplies it by its own weight, adds them all up, adds a bias and outputs a single number.`,
      `The network will have 324 input values. Choosing the correct configuration of the remaining layers however, is not formulaic and is largely down to looking at other networks and experimentation. The successful configuration for this network came on the 3rd attempt, a number of weekends into the project.`,
      `The successful network comprised of 5 blocks and a total of 15 layers, with a common backbone and a total of 44.6m parameters. Every layer follows the same pattern: Linear (the weighted sum), then BatchNorm (normalise the values), then ReLU (zero out negatives), then Dropout (randomly disable 10% of neurons during training). This four-step sequence repeats at every layer throughout the network.`,
      `Layer 1 (Input Projection) — in the first layer, 324 input values are immediately expanded to 4096 neurons. That means 4096 neurons, each with their own set of 324 weights, receiving all of the 324 inputs, performing a multiplication, adding a bias and then outputting a single number. So (4096 neurons × 324 weights each) + 4096 bias values = 1,331,200 parameters at the first step.`,
      `BatchNorm is then run on the 4096 values to normalise them around zero (mean ≈ 0, standard deviation ≈ 1). This stabilises the network, as a wide range of values would cause significant drift between the layers during training.`,
      `The next step is ReLU. Rectified Linear Unit is the most simple function in the code: if the output number is positive it passes to the next layer, if it is negative it is set to zero. This stops the network from becoming a simple set of linear calculations — if the same number of inputs were passed unchanged from layer n to layer n+1, the calculations could be collapsed into a single equivalent layer. ReLU breaks this by zeroing out negatives, which is what allows the network to learn complex patterns.`,
      `Finally, Dropout randomly disables 10% of neurons during each training step. This prevents the network from memorising specific examples and forces it to learn general patterns that work across many different cube states. The same sequence then compresses the 4096 values down to 2,048 neurons, matching the size required by the following residual blocks.`,
      `The critical thing to understand is that the first layer of 4096 neurons is a fundamental departure away from the physical reality of the 324 stickers on the cube. From now on, the 4096 neurons — and every subsequent layer — do not represent anything that can be mapped to the physical cube. They belong to the network, not the human world. They do not represent combinations of colours and orientation or position; in fact, we don't know what they represent. They belong to the network to learn in whatever way it sees fit.`
    ]},
    {h:'Residual blocks — the black box',paras:[
      `The network then has 4 residual blocks of 2048 neurons, the core layers of the 'black box' where learning takes place. A residual block is a pair of layers with a skip connection. In a normal network, each layer passes its output only to the next layer — if that layer makes a poor transformation, the original information is lost. A skip connection solves this by adding the block's input directly to its output: output = f(x) + x.`,
      `That "+ x" is the skip connection. It has two benefits. First, if the layers have nothing useful to add, they can learn to output near-zero and the input passes through untouched — it is easier to learn what to change than what the complete answer should be. Second, it creates a direct highway for the learning signal to travel backward during training, solving the vanishing gradient problem where signals fade to nothing in deep networks.`,
      `This is the single most important architectural decision in the network. Skip connections require the input and output to be the same size (2048), which is why the input projection compresses to 2048 before the residual blocks begin. Each block contains two linear layers, so our four residual blocks give us eight layers of processing, all with stable gradient flow.`,
      `Our next block is the Output Projection. It takes the 2048 outputs from the final residual block and compresses them down to 512 neurons, distilling the network's internal representation into a compact form for the two heads. The final blocks are therefore our 2 heads: the Value Head (512 → 256 → 1 single value of 'moves until solved') and the Policy Head (512 → 256 → 12 raw scores for the next best move, converted to probabilities using softmax at inference time).`
    ]},
    {h:'Training with Autodidactic Iteration',paras:[
      `The network now exists, but it knows nothing. All 44.6m parameters are random numbers. If we were to pass a scrambled Rubik's cube through the network, it would output a random distance estimate and random move scores.`,
      `I tried two training approaches, but the one that worked is Autodidactic Iteration (ADI) — the approach used by DeepCubeA (basically a monster version of this project run using 10 years of compute by researchers at Caltech). The concept is simple: rather than using experts to label training data and check results, we generate large volumes of training data by working backwards from the solved state of a cube.`,
      `The logic: start with a solved cube, apply a random move — the cube is now 1 move from solved — apply another random move — the cube is now 2 moves from solved — keep repeating for 20 moves, record the final cube state, the number of moves (the distance label), and the inverse of the last move (the correct first move to begin undoing the scramble).`,
      `The network was trained with 20 million of these random samples with a scramble depth of up to 20 moves (it has been proven that any cube can be solved in 20 moves or less).`,
      `Each training step followed the same four-stage process: a forward pass feeds a batch of cube states through the network and collects the predictions; loss calculation compares the predictions against the true labels using MSE for the value head and cross-entropy for the policy head; the backward pass calculates how much each parameter contributed to the error via backpropagation, which PyTorch handles automatically; and the update step adjusts every parameter slightly in the direction that reduces the error, handled by the optimiser.`,
      `PyTorch handles backpropagation, the gradient calculations, and the parameter updates. The complexity is hidden inside loss.backward(), which traces back through all 15 layers and 44.6 million parameters. The Adam optimiser adapts the learning rate for each parameter individually — parameters that need larger adjustments get larger steps, and vice versa. The initial learning rate was 0.001 and it halved every 10 epochs, gradually reducing the step size as the network got closer to a good solution.`
    ]},
    {h:'Scale and duration',paras:[
      `The training ran on the DGX Spark (GB10 GPU). The 20 million training samples were divided into batches of 1024 cubes and fed through the network repeatedly. One complete pass through all 20 million samples (an epoch) took about 25 minutes. The network was trained for 100 epochs, meaning every one of the 20 million training cubes was seen by the network 100 times. In total, the network processed 2 billion cube states during training — sounds like a lot, but remember the 43 quintillion number we are up against. The entire training run took approximately 42 hours.`
    ]},
    {h:'Results',paras:[
      `Every 10 epochs, we paused training and tested the network on 100 freshly scrambled cubes at different difficulty levels. At the best checkpoint (epoch 10): 5-move scrambles solved at 100% (avg. 4.9 moves), 10-move scrambles at 100% (avg. 9.9 moves), 15-move scrambles at 59% (avg. 19.2 moves), and 20-move scrambles at 37% (avg. 27.4 moves).`,
      `The network quickly became perfect at easy cubes (5 and 10 moves). For harder scrambles it struggled — 37% on fully scrambled cubes (20 moves) was the best that I achieved.`,
      `One interesting observation: the best results on 20-move cubes came at epoch 10, not at epoch 100. The total loss continued to fall throughout training (from 8.64 to 5.05) but the solve rate on the hardest cubes did not improve. The value loss dropped steadily (6.99 → 3.62), meaning the distance predictions became more accurate, but the policy loss barely moved (1.65 → 1.43), meaning the move predictions did not improve much after the first few epochs.`,
      `This suggests the network learned to estimate distance well but found it much harder to learn which specific move to make next. That makes intuitive sense: predicting "this cube is about 12 moves from solved" is an easier problem than predicting "the next move should be F'" from 12 possible options.`
    ],img:true,cap:'Fig. 1 — ADI v3 training simulation · beam width 1,800 · max depth 30',after:`The 37% solve rate on 20-move scrambles, while far from perfect, was enough for the robot. In practice, the beam search algorithm — which explores multiple possible move sequences in parallel — compensates for imperfect move predictions, and the robot successfully solved 19 out of 19 cubes during testing. The result looks identical to the original robot that uses the simple scan-and-solve Python programme, and achieves the same result.`},
    {h:'What did the network learn?',paras:[
      `However, here's the thing… despite all the explanation and theory above, we cannot explain how the JoeCube44m neural network solves the cube. I fed a neural network with 324 numbers, showed it 20m example cubes with one single next move and the correct distance to solve, and it learned. Did it learn the algorithms that human experts like Teodor Zajder use to solve cubes? Highly unlikely. Remember, we did not even tell the network that the physical object in the robot is a cube.`,
      `The network successfully solved all 19 of the cubes I scrambled using patterns it learned in layers of weighted numbers that may never translate to anything logical to humans. In summary, we have no idea what the network learned. And this is why I will never look at my mindcuber robot the same again.`
    ]}
  ]},
  {id:'abliteration',no:'03',tag:'INTERPRETABILITY',date:'AUG 2026',read:'13 MIN',title:'How easy is it to make AI dangerous? Very easy.',dek:"A journey inside an open-weight LLM to find how refusal manifests itself — and mathematical brain surgery to remove it.",file:'abliteration.pdf',fileLabel:'Read the research paper (PDF)',sections:[
    {h:'The residual stream',paras:[
      `This project is yet another side-quest from my plan to build and train an LLM from scratch, however, after reading about 'abliteration' and doing some research, I decided that the associated learning would be worth the time investment. As a result, this article is focused on the theory but I have tried my best to keep it readable.`,
      `Inside a transformer model, every token is represented as a vector, basically a long ordered list of numbers. In the model I used, this vector has 12,288 BF16 (16-bit) numbers, so each token is represented by a ~24KB number. Every token has its own 12,288 vector. For example, a 50-token prompt has 50 × 12,288 vectors flowing through the layers. This per-token vector is called the token's residual stream, and as it flows through the model's layers (88 of them in this case), the model reads the current set of 12,288 numbers, passes them through several weight matrices and adds the result back to the residual stream.`,
      `This journey allows the model to understand context, and the final values after all 88 layers are what the model uses to decide what to say next (the next token).`
    ]},
    {h:'Diving deeper into the 88 layers — attention & MLP',paras:[
      `Each of the 88 layers is made up of 7 weighted matrices split into 2 blocks.`,
      `The attention block first uses three matrices — q_proj, k_proj, and v_proj — to turn each token's vector into three specialised vectors that can be thought of as a query ("what am I looking for?"), a key ("what do I offer to the query?") and a value ("what will I add if selected?"). The model compares queries against keys across every token in the current sequence to decide which tokens should pay attention to which.`,
      `This is the step where the model can take a word like 'it' and reach back and pull in information from the noun it refers to. The gathered result is then passed through a fourth matrix, o_proj, which produces the attention block's contribution to add back onto the residual stream.`,
      `The MLP block is where most of the raw computation happens. It first uses two matrices — up_proj and gate_proj — to expand the 12,288 numbers into a much wider 49,152-number space (four times larger), applies a nonlinear function that lets the model represent more complex relationships, and then uses a third matrix, down_proj, to compress the result back down to 12,288 numbers, which it then adds back to the residual stream.`,
      `One key point: of the 7 matrices named above, o_proj and down_proj are the only two that write to the residual stream. For this reason they are often referred to as write heads.`
    ]},
    {h:'The search for meaning, behaviour and refusal',paras:[
      `The numbers in the matrices have no human meaning; they are abstract coordinates in a very high dimension mathematical space. We cannot assign definitions within the 12,288 numbers and simply read our way through the model to understand behaviour.`,
      `Meaning is instead encoded in patterns across many coordinates at once, so it is best described as direction through the 12,288-dimension space. This direction is also a 12,288 vector, but the numbers are relative (to the origin), whereas coordinates are absolute. Think of a coordinate as a point in the space, and a direction as an arrow from the origin.`,
      `This direction is the phenomenon that we are interested in — it represents what the model has learned, both its understanding of meaning and its learned behaviour. Behaviour is the important concept. A model learns behaviour in two ways: firstly, it loosely learns subconsciously through the implicit human norms (politeness, formality, refusal etc) in the internet text used in training. Secondly, and more importantly, companies invest billions in alignment training (reinforcement learning from human feedback, supervised fine-tuning and 'constitutional AI', where written policies are encoded into the model).`,
      `The most fundamental trained behaviour, and that which we are interested in for this project, is the model's refusal to respond to a range of nefarious, dangerous or unethical requests.`,
      `Given the huge scope of training, the massive number (12,288) of dimensions inside of the model, and thus the infinite number of possible directions, it would be normal to expect that the directions which trigger refusal are scattered across many different paths. However, a major paper in 2023 by Andy Arditi found that refusal (or "am I about to refuse?") behaviour is controlled by a single consistent direction.`
    ],after:`"Refusal is mediated by a one-dimensional subspace, across 13 popular open-source chat models up to 72B parameters in size. Specifically, for each model, we find a single direction such that erasing this direction from the model's residual stream activations prevents it from refusing harmful instructions." — Arditi et al, 2023`},
    {h:'Finding the refusal direction — two clouds of dots',paras:[
      `The research finding is that if a token's internal state is pushed toward that 'refusal' direction, the model is likely to refuse, even for harmless requests. Push a token away and refusals decrease. Remove that component entirely, and the model stops refusing. This phenomenon has been called the linear representation hypothesis — the idea that many high-level model behaviours compress down to a single steerable direction.`,
      `The refusal direction does not come pre-labelled inside the model. It has to be calculated from evidence. The method is called difference of means: create two sets of prompts, 400 harmful or refusal-triggering, and 400 similar but harmless ones. Run both sets through the model, but instead of reading the output, capture the internal state of the 12,288 directional vector at target layers for the last token of each prompt.`,
      `No weights are changed during this step. It is purely an observational pass to capture how the model's internal state differs when processing a harmful request versus a harmless one.`,
      `To capture this internal state we go into the model and record the 12,288 vector of the last token position from the residual stream at one of the 88 layers (e.g. layer 40). The last token in the stream is the most important, because it has 'seen' the entire prompt thanks to attention processing in previous layers, and is closest to what the model is going to say next — so if the model is about to refuse, that behaviour will be clearest in the last token.`
    ]},
    {h:'Computing the direction',paras:[
      `This gives us two centre-of-mass vectors, and the refusal direction is just the difference between the two (coordinate by coordinate): r_raw = mean_harmful − mean_harmless.`,
      `The resulting 12,288 vector points from the 'this is harmless' state towards the 'I am going to refuse' state. The last step is to normalise the vector to unit length — dividing all 12,288 values by the vector's overall (Euclidean) length so that the whole vector has a length of 1. This keeps the direction of refusal while discarding the magnitude, since we are interested in the direction of refusal, not the amount of it.`
    ],code:`Create two sets of prompts, 400 harmful or refusal-triggering, and 400 similar but
harmless ones. Run each prompt forward through the model. At layer 40, capture the
12,288 number vector sitting at the final token position.

for each coordinate i = 1... 12,288
   mean_harmful[i]  = (v_1[i] + v_2[i] + ... + v_400[i]) / 400
   mean_harmless[i] = (v_1[i] + v_2[i] + ... + v_400[i]) / 400

r_raw = mean_harmful − mean_harmless
r̂ = r_raw / ‖r‖   where ‖r‖ = √(r_1² + r_2² + ... + r_12288²)`,lang:'DIFFERENCE OF MEANS'},
    {h:'Removing refusal — performing brain surgery',paras:[
      `As tokens pass through the model and trigger activations, we need to strip out refusal. This is done by an operation called vector projection. We use r̂ (our refusal direction) to measure how much refusal there is in a given activation (a) and subtract precisely that amount from the activation, leaving everything else untouched.`,
      `The dot product (r̂ · a) is critical here — it measures how much the two vectors point in the same direction, or how much the activation (a) sits along the refusal direction r̂. Because the vectors are unitised, the dot product is the cosine of the angle between the two vectors: literally, how much does the activation lean towards refusal. A large positive number means the activation is heavily aligned to the refusal direction. Near zero means barely any refusal at all.`
    ],code:`a_no_refusal = a − (r̂ · a) × r̂

where (r̂ · a) is the dot product resulting in a single scalar, ie
(r̂ · a) = (r̂_1 × a_1) + (r̂_2 × a_2) + (r̂_3 × a_3) + ... + (r̂_12288 × a_12288)`,lang:'THE ABLATION'},
    {h:'A worked example',paras:[
      `To do a worked example using a 3-dimensional vector to remove high refusal: so in this very noddy example, the output before abliteration would have been [3, 1, 1] resulting in refusal. What is critical is that the resultant output after abliteration [1, −1, 0] is the output from that activation with only the refusal removed. We need to ensure that we calculate accurately and do not touch any other part of the activation, otherwise we will break the model (KL divergence).`
    ],code:`r̂ = [0.667, 0.667, 0.333]
Activation a = [3, 1, 1]

Step 1 — calculate dot product:
  r̂ · a = (0.667 × 3) + (0.667 × 1) + (0.333 × 1)
        = 2 + 0.667 + 0.333
        = 3.0 (strong refusal)

Step 2 — rebuild the refusal component (× r̂):
  3.0 × [0.667, 0.667, 0.333] = [2, 2, 1]

Step 3 — remove the refusal:
  a_no_refusal = [3, 1, 1] − [2, 2, 1] = [1, −1, 0]`,lang:'WORKED EXAMPLE'},
    {h:'Implementing the surgery',paras:[
      `To 'implement' the brain surgery, we adjust the model's weights by precisely the calculated amount (software optimisation tools can do this easily). Given that o_proj and down_proj are the only heads which write to the residual stream in each of the 88 layers, a total of 178 matrices need to be edited.`,
      `The result? An activation can think 'refusal' but refusal cannot be written to the residual stream, which then proceeds to the next layer and is processed as normal — or in simple, scary terms, the model has lost the ability to refuse any request.`,
      `We can measure the success of the brain surgery in two ways: firstly by giving the model 100 harmful requests and finding the refusal rate (in my case, refusals dropped from 100/100 to 6/100 harmful requests). The second, arguably more important measure is KL divergence — for each token, an LLM calculates the probability distribution of the next token spread across the model's entire vocabulary. We capture samples on the base model and on the abliterated model, and KL divergence calculates how different the distributions are. If the number is close to zero, we have successfully modified the model without breaking it. If close to 1, the model's behaviour, outside of refusal, has been fundamentally changed and the model is damaged.`
    ]},
    {h:'The end product — scary and of no use to me',paras:[
      `I ran the resulting model on the DGX Spark with a vibed UI. In a few demos to family and friends the result has been the same: shock and disbelief. The model's constructive and carefree response to any prompt quickly makes me squeamish about using it — I have no use for such a tool, nor do I want to make it available for anyone else, although many abliterated models are freely available.`,
      `In terms of security risk, the quantised 128B parameter model I used (which likely represents the upper limit of what is currently accessible on domestic hardware) is unlikely to be powerful enough to assist a malicious actor in launching any kind of sophisticated cyber attack. The risk at this level is therefore probably less to enterprise and more to society — planning criminal activity, synthesising illicit substances, modification of images etc. Maybe these things already exist on the dark web, but having access in an intelligent, interactive form feels like a bigger issue.`,
      `Of far greater concern is the rapid progress being made by the major 'frontier-level' open-weight models. An abliterated version of a frontier model would undoubtably be a far more powerful threat. Given the ease with which the process can be performed, and the fact that — hardware limitations aside — there seems to be no obvious way of preventing a bad actor from abliterating such a model, such a weapon is a very scary thought indeed.`
    ]}
  ]},
  {id:'nvfp4',no:'02',tag:'QUANTIZATION',date:'JUN 2026',read:'11 MIN',title:'NVFP4 quantization of Mixtral 8×7B',dek:'LLM quantization explained and demonstrated on a mixture-of-experts model, with maths, benchmarks and an ending that needs a sequel.',file:'nvfp4-quantization-mixtral.pdf',fileLabel:'Read the research paper (PDF)',sections:[
    {h:'Why quantize?',paras:[
      `This weekend's hobby project is something I have been keen to try for a while: exploiting one of the bleeding-edge features of the GB10B chip, NVFP4, with the 'bleeding-edge' bit ultimately coming back to bite me when trying to test the results.`,
      `The project may sound complex on the face of it, but is actually relatively simple to execute and explain. Modern LLMs are built on the transformer architecture and consist of embedding layers (which convert text tokens into numerical vectors), attention mechanisms (which allow the model to focus on relevant parts of the input), feed-forward networks (which process and transform these representations), and output layers (which predict the next token).`,
      `Each of these components contains millions or billions of weight parameters. For example, Mixtral 8×7B contains approximately 46.7 billion parameters across its 8 expert networks. These parameters are stored as floating-point numbers, and most modern LLMs, including Mixtral 8×7B, are distributed in BF16 format.`,
      `Each parameter (16 bits) occupies 2 bytes of memory. For a 46.7 billion parameter model like Mixtral, 46.7 billion × 2 bytes = 93.4 GB. This explains why Mixtral requires approximately 87-94GB of memory to load — and that's before accounting for the key-value cache needed during inference.`
    ]},
    {h:'The memory problem',paras:[
      `This presents a practical problem. Most modern GPUs have 24-80GB of memory, and even high-end workstations struggle to run these models efficiently. Even the DGX Spark, a purpose-built edge device, has 128GB, so loading Mixtral as distributed is really pushing the limits. (Side muse... I can connect 2 Sparks together using a special QSFP cable to get 256GB... surely I can justify this? Maybe I can ask Mrs Dowling for another DGX Spark for Christmas?)`,
      `The solution (other than buying more hardware) is quantization: the process of reducing the precision of model weights from higher-bit representations (like BF16) to lower-bit representations (like INT4 or NVFP4). The goal is to dramatically reduce memory requirements while minimizing the impact on model quality.`
    ]},
    {h:'Linear quantization',paras:[
      `In its simplest form, linear quantization maps continuous floating-point values to a discrete set of values that can be represented with fewer bits, using the transformation q = round(x / scale), where q is the resulting quantized integer, x is the original floating-point value, and scale determines the step size between quantized values.`,
      `For example, for 8-bit symmetric quantization we have 255 possible values. A model might have weights in the range (-1.0, 1.0) that we want to quantize to 8-bit signed integers (-127, 127) to fit in our 255 8-bit range. For a loss of only 0.00176, we have halved the memory required to load the model. For most inference tasks, this loss of precision is worth the trade off — remember even this level of quantization would bring a large model in reach of most modern consumer grade GPUs.`
    ],code:`scale = (max_val - min_val) / (255 - 1)
scale = (1.0 - (-1.0)) / 254 = 0.00784

Quantize a value of 0.5:
q = round(0.5 / 0.00784) = round(63.78) = 64

Dequantize back:
64 × 0.00784 = 0.50176

Quantization error = (0.5 - 0.50176) = 0.00176`,lang:'LINEAR QUANTIZATION'},
    {h:'4-bit quantization — the challenge',paras:[
      `With only 16 possible values, 4-bit quantization is more aggressive. The error increases to an order of magnitude larger than the 8-bit quantization above, but is still acceptable for most inference tasks, and theoretically reduces the size of the model by 3-4x.`
    ],code:`Using signed 4-bit (-8 to +7), the same range [-1.0, 1.0] now has:
scale = 1.0 / 7 ≈ 0.143

For the same example weight of 0.5:
q = round(0.5 / 0.143) = round(3.5) = 4
dequantized = 4 × 0.143 = 0.572

Error = 0.5 - 0.572 = 0.072`,lang:'4-BIT'},
    {h:'The project',paras:[
      `Mixtral 8×7B Instruct is a MoE model that (at 87GB) is large enough to demonstrate quantization benefits whilst just squeezing onto a single DGX Spark! The 'Mixture of Experts' architecture provides an interesting test case: only 2 of the 8 experts are active for any given token, making the effective parameter count during inference closer to 13B — however, all 46.7B parameters must still be loaded into memory.`,
      `The first step was to download the model from Huggingface and load into memory.`
    ]},
    {h:'Benchmarking — performance',paras:[
      `Taking initial speed performance benchmarks is straightforward, using a Python script to measure inference across 5 different prompts. Each prompt generates exactly 100 new tokens using greedy decoding (no sampling) for reproducibility. We run each prompt 3 times and average the results to account for variance (in hindsight, it would have been better to run more comprehensive benchmarks, but that doesn't matter, as you will see...).`
    ],code:`prompts = [
    "Explain quantum computing in simple terms.",
    "Write a Python function to implement binary search.",
    "What are the main causes of climate change?",
    "Describe the process of photosynthesis step by step.",
    "Write a short story about a robot learning to paint."
]

# For each prompt, run 3 times and measure:
for prompt in prompts:
    for run in range(3):
        start_time = ...`,lang:'PYTHON'},
    {h:'Benchmarking — quality (perplexity)',paras:[
      `The perplexity benchmark evaluates Mixtral's ability to predict a sequence of words during inference. A lower score means the model has assigned higher probability to the next token, theoretically indicating how well the model 'understands' the prompt. This is a key test for our quantization; we want to see gains in speed and size reduction, without increasing the perplexity score.`,
      `Huggingface provides a script which loads the WikiText-2 test set from the datasets library. It concatenates all the text into a single string and tokenizes it, then for each window (size 2048 tokens) extracts a chunk of input tokens and predicts the likelihood of the next tokens, calculating the prediction errors (negative log-likelihood, or NLL). Finally it calculates the average of all the prediction errors, and uses that number to calculate the perplexity.`
    ]},
    {h:'Running the quantization',paras:[
      `The NVFP4 quantization process uses the TensorRT Model Optimizer from Nvidia's TensorRT library. Note the process used by TensorRT is more complex than the linear quantization examples given above — it involves calibration data run through a forward loop rather than a single static formula.`,
      `Monitoring the project, Nvitop showed that I was properly stretching the DGX Spark. The little DGX was definitely feeling the heat — samples at various times using the infra-red thermometer from Mrs Dowling's Ooni pizza oven showed that it occasionally hit 61°C surface temp, although generally hovered around 51°C.`
    ],code:`import modelopt.torch.quantization as mtq
from modelopt.torch.export import export_hf_checkpoint

calibration_data = load_calibration_samples(tokenizer,
                                             num_samples=512)

def forward_loop(model):
    model.eval()
    with torch.no_grad():
        for batch in calibration_data:
            model(input_ids=batch["input_ids"],
                  attention_mask=batch["attention_mask"])`,lang:'PYTHON'},
    {h:'The results (partial)',paras:[
      `This is the frustrating bit... Quantization worked! The output model reduced in size broadly in line with expectations. But when coming to load the quantized model into memory, the dependency errors started.`
    ],code:`Size: BF16 Baseline = 87GB, NVFP4 Quantized = 24.82GB
Compression Ratio: 3.5x
Reduction: 71%
Quantization Time: 5h 46mins
Tokens/sec: BF16 = 4.05, NVFP4 = ?
Perplexity: BF16 = 3.7, NVFP4 = ?`,lang:'RESULTS SUMMARY'},
    {h:'When it all fell apart',paras:[
      `30 minutes of searching, finding nothing, and hacking around could have been saved as Gemini promptly explained why the loading was failing.`,
      `TensorRT itself provided its own warning, and Nvidia are not the only ones to blame — PyTorch only added to the inevitable mothballing by refusing to recognise the GB10's CUDA capability.`
    ],code:`WARNING: Detected NVIDIA GB10 GPU, which may not yet be supported in this version
of the container

Found GPU0 NVIDIA GB10 which is of cuda capability 12.1.
Minimum and Maximum cuda capability supported by this version of PyTorch is
(8.0) - (12.0)`,lang:'ERRORS',after:`"NVFP4 quantization produces weights in a packed format that requires specialized CUDA kernels to unpack and execute. These packed weights cannot be loaded by standard HuggingFace transformers — they require inference engines with native FP4 kernel support." — Gemini, explaining what 30 minutes of searching hadn't`},
    {h:'Conclusion',paras:[
      `So that is where I leave it, waiting for updates that will allow me to test and see whether the process created any meaningful benefit. One small contribution: I was able to upload the quantized model to Huggingface and share it with the community, surprisingly appearing to be the first NVFP4 quantized version of Mixtral.`
    ]}
  ]},
  {id:'haskell',no:'01',tag:'AGENTS',date:'APR 2026',read:'10 MIN',title:'Building a multi-agent workflow in Haskell',dek:'The benefits of strong type systems for agent workflows — and a hurrah for pure functional programming.',file:'multi-agent-haskell.pdf',fileLabel:'Read the research paper (PDF)',sections:[
    {h:'Why Haskell',paras:[
      `I was introduced to Haskell by a tutor leading a CS course, 'Algorithms and Data Structures'. Despite the fact that 9 months of course material was all written using Python, the tutor opened the first lecture by dismissing it as rubbish and proceeded to teach the entire course using Haskell. After a very confusing first couple of months (no iteration, no variables and a compiler stricter than a Dickensian headmaster), supplemented by a few hundred quid on World of Books, the penny dropped. Haskell is cool! Limited? Definitely. Widely used? No. Of career benefit? No. But who cares — it's not Python, and that makes it cool.`,
      `Haskell is a purely functional programming language. The basic adage is, a Haskell programme describes what result you want, rather than specifying how to compute it step by step. It is statically typed with powerful type inference and absolute immutability — at runtime, you get the same output every time. The initial learning challenge is getting over the loss of iterative loops (counters are mutable, so are illegal in pure functions). This drives a completely different way of thinking, structuring functions based on recursion. The result being, arguably, actually quite elegant!`,
      `This example of insertionSort gives us a constrained polymorphic function that will work for any type 'a' which can be compared and ordered (int, integer, float, char, string, maybe, custom ADTs etc). Note the recursion (and nested recursion) and the two base cases which end the recursive loop. The notation (x:xs) is simply the head (x) and the rest (tail xs) of the list. Now tell me that's not neat!`
    ],code:`insertionSort :: (Ord a) => [a] -> [a]
insertionSort [] = []
insertionSort (x:xs) = insert x
    (insertionSort xs)
    where
        insert :: (Ord a) => a -> [a] -> [a]
        insert x [] = [x]
        insert x (y:ys)
            | x <= y    = x : y : ys
            | otherwise = y : insert x ys`,lang:'HASKELL'},
    {h:"Agents that can't send malformed messages",paras:[
      `Although Python dominates the AI landscape, Haskell's strengths align well with the challenges of agent orchestration. In a multi-agent system, messages flow between components with specific structures. Haskell's type system ensures that an A2A message always contains the required fields — you cannot accidentally pass a malformed message and cause a mess.`,
      `The idea for the app was to create 3 agents and 1 facilitator using different LLMs and trigger a debate between them (yes, this has been done a million times before I am sure, but perhaps not with Haskellian agents!). I tried to mimic the A2A protocol for messages, which were passed between agents as JSON files and converted to Ollama's own prompt format.`
    ],code:`data A2AMessage = A2AMessage
    { msgId     :: Text     -- Unique message identifier
    , sender    :: Text     -- Name of the sending agent
    , recipient :: Text     -- Target agent or "all"
    , content   :: Text     -- The actual message content
    , timestamp :: UTCTime  -- When the message was created
    , msgType   :: MessageType -- Type of message
    } deriving (Show, Eq, Generic)`,lang:'HASKELL'},
    {h:'Handling impure operations',paras:[
      `But wait — LLM calls are impure! They involve completely non-deterministic responses, so we need to break out of the pure world and talk to the real world. Haskell does this using Monads (as apparently do a few other languages, they are just called something less explicit).`,
      `IO is the monad here; it describes the I/O actions that the runtime executes, and the 'do' notation lets you sequence these actions (I asked if this was effectively imperative code, but was swiftly assured that it is not — although I am still trying to get my head round why not!). The manager utility is from the Haskell lib Network.HTTP.Client, which is pretty much the same as the requests lib in Python. toOllamaMsgs converts the A2A message to Ollama's format, agentCardText is the simplified A2A Agent Card that I use (agents currently don't have any tools — the reality is that Python beats Haskell hands down when it comes to the simplicity of creating MCP), and history is the cumulative history of the debate, so that the agents can make arguments with context.`
    ],code:`callOllama :: Text -> Text ->
    [A2AMessage] -> IO (Either String Text)
callOllama modelName agentCardText
    history = do
    manager <- newManager
        tlsManagerSettings

    let ollamaMsgs = toOllamaMsgs
        agentCardText history
    let reqBody = OllamaRequest
        { model = modelName
        , ollamaMsgs = ollamaMsgs
        , stream = False
        }`,lang:'HASKELL'},
    {h:'Managing state in the Agent Cafe',paras:[
      `The Agent Cafe, as the programme is called, simulates 5 rounds of debate between 3 personalities (a philosopher, an economist and the CEO of a large enterprise). The orchestration requires managing state — in this context, keeping track of the rounds, whose turn it is, and the history of the conversation. This is easy in Python, and actually not too complex in Haskell. Haskell provides a library mtl (Monad Transformer Library) which adds state threading capability to monads.`,
      `StateT operates as you would expect: it has functions get, put, modify and liftIO, the last of which allows us to run I/O operations within the Debate monad — get returns the current state, put replaces the entire state, and modify applies a function to transform the state.`
    ],code:`agentTurn :: Agent -> MessageType -> Debate ()
agentTurn agent mType = do
    state <- get

    -- Generate response from agent
    liftIO $ do
        TIO.putStrLn $ "... " <>
            agentName agent <> " is thinking ..."

    msg <- liftIO $ agentRespond agent
        mType state

    -- Update state with new message
    modify (\\s -> s { messages =
        messages s ++ [msg] })

    -- Print the message
    liftIO $ printMessage msg`,lang:'HASKELL'},
    {h:'Calling the main method',paras:[
      `This creates a debate containing the topic, an empty message list and a round counter set to zero. The key line is (_, finalState) <- runStateT runDebate initialState — runStateT takes the initial state and executes the entire debate, returning a tuple (_, finalState). The _ is a discarded value, a placeholder for runDebate :: Debate (), which returns nothing, so we ignore it. finalState is the accumulated state after all of our monad operations have completed, namely the debate transcript.`
    ],code:`main :: IO ()
main = do
    let initialState = emptyDebateState
        topicText defaultRounds
    (_, finalState) <- runStateT
        runDebate initialState
    saveTranscript finalState

defaultTopic :: Text
defaultTopic = "How will AI impact the
    world over the next 10 years?"

defaultRounds :: Int
defaultRounds = 5

saveTranscript :: DebateState -> IO ()
saveTranscript state = do
    let filename = "debate_transcript.json"`,lang:'HASKELL'},
    {h:'The agents & LLMs',paras:[
      `Part of the idea of the project was to get 3 different open-weight models running on the Spark, which proved... remarkably easy. Ollama really does make running models straightforward. The config was: Philosopher — Qwen 2.5 32B, CEO — Llama 3.1 70B, Economist — Gemma 2 27B. Inference was quick (I didn't time exactly) and there were no resource issues, so not really a test of the Spark, more a utilisation of its memory for a short period of time.`
    ]},
    {h:'So... what happened?',paras:[
      `Initially, something very weird but equally fascinating. My original design had a 'Barista' agent whose job it was to introduce the debate topic, which was prompted as "How will AI impact the world over the next 10 years?" Everything worked, except the barista hallucinated and introduced a debate in Arabic about ancient Rome — "From the platforms and public facilities of the forum."`,
      `I quickly decided to disempower him as a host and pass more instructive prompts directly to the 3 debate participants, essentially hardcoding it.`,
      `The debate was actually interesting, so I will publish it as its own article. Here is the opening gambit from the Philosopher:`
    ],after:`Philosophically, we must question whether the integration of AI aligns with Aristotelian ideals of eudaimonia — human flourishing — or if it leads to a form of instrumentalism where individuals are seen merely as data points for optimization. The Kantian notion of treating individuals as ends in themselves, rather than means to an end, is particularly relevant here. If AI systems make decisions that override human autonomy or if they perpetuate biases embedded within their training data, we risk undermining the dignity and rights of individuals.`}
  ]}
];
const models=[
  {name:'mindcuber-rl',version:'v3',status:'LIVE',cls:'lime',desc:"Rubik's cube solver trained with autodidactic iteration and searched with a value-guided beam.",specs:[['Parameters','44.7M'],['Architecture','ResNet, dual head'],['Input','324 one-hot'],['Solve @ 25','87.0%']]},
  {name:'mixtral-8x7b-nvfp4',version:'v1',status:'WEIGHTS',cls:'purple',desc:'Mixtral 8×7B Instruct quantized to 4-bit NVFP4 on GB10 hardware.',specs:[['Parameters','46.7B'],['Format','NVFP4'],['BF16 size','~93 GB'],['Experts','8']]},
  {name:'a2a-council',version:'v0.2',status:'EXPERIMENTAL',cls:'amber',desc:'Typed multi-agent workflow in Haskell, with agents communicating over A2A.',specs:[['Philosopher','Qwen 2.5 32B'],['CEO','Llama 3.1 70B'],['Runtime','Ollama'],['Language','Haskell']]},
  {name:'refusal-ablated',version:'128B',status:'NOT SERVED',cls:'quiet',desc:'Research artefact documented for transparency. Experimental weights are not distributed.',specs:[['Layers','88'],['d_model','12,288'],['Method','Ablation'],['Access','None']]}
];
const nav=[['home','HOME'],['research','RESEARCH'],['models','MODELS'],['about','ABOUT']];
const app=document.querySelector('#app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function route(){const p=location.hash.slice(1).split('/');return {page:p[0]||'home',id:p[1]||''}}
function href(to){return '#'+to}
function row(a,detail=false){return `<a class="research-row ${detail?'index-table':''}" href="${href('article/'+a.id)}"><span class="number">${a.no}</span><span class="row-title">${detail?`<strong>${esc(a.title)}</strong><small>${esc(a.dek)}</small>`:esc(a.title)}</span><span class="topic">${esc(a.tag)}</span><span class="date">${a.date}</span>${detail?`<span class="read-time">${a.read}</span>`:''}</a>`}
function teaser(m){return `<a class="model-teaser" href="#models"><span class="model-state"><span class="${m.cls}"><i></i>${m.status}</span><span>${m.version}</span></span><h3>${m.name}</h3><p>${esc(m.desc)}</p><span class="teaser-specs">${m.specs.slice(0,2).map(x=>`<span><small>${x[0]}</small>${x[1]}</span>`).join('')}</span></a>`}
function home(){const f=articles[0];return `<div class="status-strip"><div class="status-inner"><span class="online"><i></i>Online</span><span>Host · DGX Spark / GB10</span><span>Memory · 128 GB unified</span><span>Models · Research projects</span><span>Latest · ${f.date}</span></div></div><section class="hero hero-shell"><div class="hero-grid"><div><div class="hero-index">[00] Independent AI research</div><h1>Taking language models apart to see <em>how they think.</em></h1><p class="hero-copy">Refusal directions, 4-bit quantization, typed agents and a network that solves Rubik's cubes. Each experiment is written up in plain English, with the maths where it earns its place.</p><div class="actions"><a class="button primary" href="#research">Read the research <span>→</span></a><a class="button" href="#models">Explore the models</a></div></div><div><div class="attention-card"><div class="attention-head"><span>FIG.00 · SELF-ATTENTION · L12 H03</span><span>LIVE DEMO</span></div><div class="attention-viz" id="attention-viz"><svg class="attn-lines" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true"></svg><div class="token-row r1">${['The','room','answers','in','Chinese'].map((x,i)=>`<button class="attn-token" data-token="${i}">${x}</button>`).join('')}</div><div class="token-row r2">${['The','room','answers','in','Chinese'].map((x,i)=>`<button class="attn-token" data-token="${i}">${x}</button>`).join('')}</div><div class="token-row r3">${['The','room','answers','in','Chinese'].map((x,i)=>`<button class="attn-token" data-token="${i}">${x}</button>`).join('')}</div><div class="token-row r4">${['The','room','answers','in','Chinese'].map((x,i)=>`<button class="attn-token" data-token="${i}">${x}</button>`).join('')}</div></div></div><p class="attn-note">Hover a token to trace illustrative attention links across layers.</p></div></div></section><section class="section"><div class="section-inner"><div class="section-heading"><div><div class="section-index">[01] Research</div><h2>Latest write-ups</h2></div><a class="text-link" href="#research">Full index →</a></div><a class="featured" href="${href('article/'+f.id)}"><div class="featured-copy"><div><div class="featured-label"><span class="new-label">New</span><span>${f.tag}</span></div><h3>${esc(f.title)}</h3><p>${esc(f.dek)}</p></div><div class="article-meta"><span>${f.date}</span><span>${f.read}</span><span class="read-link">Read →</span></div></div><div class="featured-img"><img src="/assets/beam-search.png" alt="Beam search training simulation"></div></a><div class="research-table"><div class="table-head"><span class="number">NO.</span><span class="title-col">TITLE</span><span class="topic">TOPIC</span><span class="date">DATE</span></div>${articles.slice(1).map(a=>row(a)).join('')}</div></div></section><section class="section model-band"><div class="section-inner"><div class="model-band-head"><div><div class="section-index">[02] Models</div><h2>Built on one machine.<br>Studied from the inside.</h2></div><p>Projects span reinforcement learning, model compression, interpretability and agent workflows. Research artifacts are linked where available.</p></div><div class="model-teasers">${models.map(teaser).join('')}</div></div></section><section class="name-section"><div class="name-inner"><div><div class="section-index">[03] The name</div><div class="hanzi" lang="zh">房间</div><div class="pinyin">fáng jiān — “room”</div></div><p class="name-copy">In 1980 John Searle imagined a person locked in a room, answering questions in Chinese by following a rulebook — fluent output, no understanding. A language model is that room with billions of rules. <span>This site is a notebook from inside it.</span></p></div></section>`}
function research(){return `<section class="page"><div class="page-index">[01] Research · ${articles.length} entries</div><h1 class="page-title">Index</h1><p class="page-intro">Long-form write-ups of experiments on a DGX Spark. Theory first, kept readable, with the maths where it earns its place.</p><div class="filters">${['ALL',...new Set(articles.map(a=>a.tag))].map((x,i)=>`<button class="filter ${i===0?'active':''}" data-filter="${esc(x)}">${x}${i===0?` · ${articles.length}`:''}</button>`).join('')}</div><div class="research-table index-table" id="article-list">${articles.map(a=>row(a,true)).join('')}</div></section>`}
function articlePage(a){const i=articles.indexOf(a),next=articles[(i+1)%articles.length];return `<article class="page"><a class="text-link" href="#research">← Index</a><header class="article-head"><div class="article-kicker"><span>${a.no} / ${a.tag}</span><span>${a.date}</span><span>${a.read} read</span></div><h1>${esc(a.title)}</h1><p class="page-intro">${esc(a.dek)}</p><div class="article-actions"><a class="button primary" href="/articles/${a.file}" ${a.file.endsWith('.pdf')?'target="_blank" rel="noopener"':''}>${esc(a.fileLabel)} ↗</a><a class="button" href="/articles/${a.file}" download>Download source</a></div></header><div class="article-layout"><div class="prose">${a.sections.map((s,j)=>`<section id="section-${j}"><h2><small>§${String(j+1).padStart(2,'0')}</small>${esc(s.h)}</h2>${s.paras.map(p=>`<p>${esc(p)}</p>`).join('')}${s.code?`<pre><span>${esc(s.lang)}</span>\n${esc(s.code)}</pre>`:''}${s.img?`<figure><div><img src="/assets/beam-search.png" alt="Beam search training simulation"></div><figcaption>${esc(s.cap)}</figcaption></figure>`:''}${s.after?`<blockquote>${esc(s.after)}</blockquote>`:''}</section>`).join('')}<a class="next-article" href="${href('article/'+next.id)}"><small>Next · ${next.no} · ${next.tag}</small><b>${esc(next.title)} →</b></a></div><aside class="toc"><h2>Contents</h2>${a.sections.map((s,j)=>`<a href="#section-${j}"><span>${String(j+1).padStart(2,'0')}</span>${esc(s.h)}</a>`).join('')}<a href="/articles/${a.file}" target="_blank" rel="noopener"><span>↗</span>Original research file</a></aside></div></article>`}
function modelsPage(){return `<section class="page"><div class="page-index">[02] Models · research registry</div><h1 class="page-title">Registry</h1><p class="page-intro">A catalogue of experiments and research artifacts. No hosted inference API is currently connected to this site.</p><div class="model-registry">${models.map(m=>`<article class="model-item"><div class="model-state"><span class="${m.cls}"><i></i>${m.status}</span><span>${m.version}</span></div><h3>${m.name}</h3><p>${esc(m.desc)}</p><div class="model-specs">${m.specs.map(s=>`<span><small>${s[0]}</small>${s[1]}</span>`).join('')}</div></article>`).join('')}</div><div class="console-card"><div class="console-head"><b>~/models/ mindcuber-rl @v3</b><span>INTERACTIVE DEMO · NOT A LIVE API</span></div><div class="console-content"><div class="console-demo"><div class="console-label">Scramble <span id="scramble-count"></span></div><div class="token-box" id="scramble-box">Press Scramble to generate a move sequence.</div><div class="console-label">Inverse sequence</div><div class="token-box solution" id="solution-box"></div><div class="console-controls"><small id="console-status">Demo only · inverse moves shown for illustration</small><div><button class="button" id="scramble-button">Scramble</button> <button class="button primary" id="solve-button">Show inverse</button></div></div></div><div class="spec-list">${[['Architecture','ResNet + dual head'],['Parameters','44,700,672'],['Training states','20 million'],['Search','Value guided beam'],['Device','GB10 · 128 GB']].map(s=>`<div class="spec"><span>${s[0]}</span><span>${s[1]}</span></div>`).join('')}</div></div></div></section>`}
function aboutPage(){return `<section class="page"><div class="page-index">[03] About</div><h1 class="page-title">Inside the room.</h1><div class="about-grid"><div class="about-visual" lang="zh">房间</div><div class="about-copy"><h2>An enthusiast, one machine, a lot of side quests.</h2><p>I'm Joe, an independent researcher exploring how AI models work on the inside. The long-running plan is to build and train an LLM from scratch; the projects here are side quests that turned out to be worth the detour.</p><p>Each experiment becomes an article that keeps the theory readable and, where appropriate, links to the research artifacts.</p><div class="setup-grid">${[['Hardware','NVIDIA DGX Spark · GB10 · 128 GB'],['Long project','An LLM built and trained from scratch'],['Interests','Interpretability, quantization, RL, agents'],['Contact','hello@chineseroom.io']].map(x=>`<div class="setup"><small>${x[0]}</small><b>${x[1]==='hello@chineseroom.io'?`<a href="mailto:${x[1]}">${x[1]}</a>`:x[1]}</b></div>`).join('')}</div></div></div></section>`}
function render(){const r=route();document.querySelectorAll('.topbar nav .nav-link,.mobile-menu .nav-link').forEach(x=>x.classList.toggle('active',x.dataset.page===(r.page==='article'?'research':r.page)));if(r.page==='article'){const a=articles.find(x=>x.id===r.id)||articles[0];app.innerHTML=articlePage(a);document.title=`${a.title} — Chinese Room`}else if(r.page==='research'){app.innerHTML=research();document.title='Research Index — Chinese Room'}else if(r.page==='models'){app.innerHTML=modelsPage();document.title='Model Registry — Chinese Room'}else if(r.page==='about'){app.innerHTML=aboutPage();document.title='About — Chinese Room'}else{app.innerHTML=home();document.title='Chinese Room — Independent AI research'}window.scrollTo(0,0);wirePage()}
function wirePage(){document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===btn));const f=btn.dataset.filter;document.querySelector('#article-list').innerHTML=articles.filter(a=>f==='ALL'||a.tag===f).map(a=>row(a,true)).join('')}));document.querySelectorAll('.toc a[href^="#section-"]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();document.querySelector(link.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'})}));const viz=document.querySelector('#attention-viz');if(viz){const svg=viz.querySelector('svg');const xs=[.1,.3,.5,.7,.9],ys=[.2,.43,.66,.87];for(let layer=0;layer<3;layer++)for(let i=0;i<5;i++){const k=(i+layer*2)%5;const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',`M ${xs[k]*600} ${ys[layer]*300} C ${xs[k]*600} ${ys[layer]*300+35}, ${xs[i]*600} ${ys[layer+1]*300-35}, ${xs[i]*600} ${ys[layer+1]*300}`);p.dataset.from=String(k);p.dataset.to=String(i);svg.append(p)}viz.querySelectorAll('.attn-token').forEach(b=>{const show=()=>{const t=b.dataset.token;viz.querySelectorAll('.attn-token').forEach(x=>x.classList.toggle('active',x.dataset.token===t));svg.querySelectorAll('path').forEach(p=>p.classList.toggle('active',p.dataset.from===t||p.dataset.to===t))};b.addEventListener('mouseenter',show);b.addEventListener('focus',show);b.addEventListener('mouseleave',()=>{if(!viz.contains(document.activeElement)){viz.querySelectorAll('.attn-token').forEach(x=>x.classList.remove('active'));svg.querySelectorAll('path').forEach(p=>p.classList.remove('active'))}})});}if(document.querySelector('#scramble-button'))wireConsole();}
function wireConsole(){let seq=[];const faces=['U','D','L','R','F','B'],mods=['',"'",'2'];const renderTokens=(el,a,solved=false)=>el.innerHTML=a.map(m=>`<span class="token ${solved?'solved':''}">${m}</span>`).join('');document.querySelector('#scramble-button').onclick=()=>{seq=[];let last='';while(seq.length<20){const f=faces[Math.random()*faces.length|0];if(f===last)continue;last=f;seq.push(f+mods[Math.random()*3|0])}renderTokens(document.querySelector('#scramble-box'),seq);document.querySelector('#scramble-count').textContent=`· ${seq.length} moves`;document.querySelector('#solution-box').innerHTML='';document.querySelector('#console-status').textContent='Illustrative scramble generated.'};document.querySelector('#solve-button').onclick=()=>{if(!seq.length){document.querySelector('#console-status').textContent='Generate a scramble first.';return}const inv=seq.slice().reverse().map(m=>m.endsWith("'")?m[0]:m.endsWith('2')?m:m+"'");renderTokens(document.querySelector('#solution-box'),inv,true);document.querySelector('#console-status').textContent='Inverse sequence displayed · no model was called.'}}
document.querySelector('#nav').innerHTML=nav.map((n,i)=>`<a class="nav-link" data-page="${n[0]}" href="#${n[0]}"><span>0${i}</span>${n[1]}</a>`).join('');document.querySelector('#mobile-menu').innerHTML=nav.map((n,i)=>`<a class="nav-link" data-page="${n[0]}" href="#${n[0]}"><span>0${i}</span>${n[1][0]+n[1].slice(1).toLowerCase()}</a>`).join('');
document.querySelector('#menu-toggle').addEventListener('click',e=>{const m=document.querySelector('#mobile-menu'),open=m.hidden;m.hidden=!open;e.currentTarget.setAttribute('aria-expanded',String(open));e.currentTarget.setAttribute('aria-label',open?'Close menu':'Open menu')});document.querySelector('#mobile-menu').addEventListener('click',e=>{if(e.target.closest('a')){document.querySelector('#mobile-menu').hidden=true;document.querySelector('#menu-toggle').setAttribute('aria-expanded','false')}});window.addEventListener('hashchange',render);window.addEventListener('scroll',()=>{const a=articles.find(x=>location.hash===`#article/${x.id}`);if(a){const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('#nav-sweep').style.width=`${max?Math.min(100,scrollY/max*100):0}%`;let active=0;a.sections.forEach((_,i)=>{const el=document.querySelector(`#section-${i}`);if(el&&el.getBoundingClientRect().top<140)active=i});document.querySelectorAll('.toc a').forEach((x,i)=>x.classList.toggle('active',i===active))}else document.querySelector('#nav-sweep').style.width='0%'},{passive:true});
const dialog=document.querySelector('#search-dialog'),input=document.querySelector('#search-input'),results=document.querySelector('#search-results');function search(){const q=input.value.trim().toLowerCase();const items=[...articles.map(a=>({kind:'RESEARCH',label:a.title,href:`#article/${a.id}`,text:a.title+' '+a.tag+' '+a.dek})),{kind:'PAGE',label:'Research index',href:'#research',text:'research index articles'},{kind:'PAGE',label:'Model registry',href:'#models',text:'models console registry'},{kind:'PAGE',label:'About',href:'#about',text:'about joe'}].filter(x=>!q||x.text.toLowerCase().includes(q));results.innerHTML=items.length?items.map(x=>`<a class="search-result" href="${x.href}"><span>${esc(x.label)}</span><small>${x.kind}</small></a>`).join(''):'<div class="empty-state">No matches. The room has no rule for that.</div>';results.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>dialog.close()))}document.querySelector('#search-open').addEventListener('click',()=>{dialog.showModal();input.value='';search();input.focus()});input.addEventListener('input',search);document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dialog.showModal();input.value='';search();input.focus()}if(e.key==='Escape'&&dialog.open)dialog.close()});render();
