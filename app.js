const articles = [
  {id:'mindcuber',no:'04',tag:'NETWORK TRAINING',date:'SEP 2026',read:'18 MIN',title:"AI, a Lego robot and a Rubik's cube",dek:"I trained a network to suggest cube moves, used search to find solutions, and sent them to a Lego robot. The best checkpoint solved 37 of 100 test cubes scrambled with 20 moves.",file:'mindcuber.docx',fileLabel:'Download the article (.docx)',sections:[
    {h:'Easy for humans, hard for machines',paras:[
      `Most people can learn to solve a Rubik's cube in a couple of hours. Doing so involves recognising a few key patterns, learning 6 or 7 simple algorithms and practice. Taken to extremes, the global speedcube circuit includes numerous youngsters who can solve a scrambled cube in under 4 seconds, with the current record holder, 9-year-old Teodor Zajder from Poland, clocking 2.76 seconds at an event in February 2026.`,
      `It might be surprising then, to discover that a Rubik's cube falls into a category of problems which is straightforward for humans, but incredibly difficult for a computer that has not been pre-programmed with the required algorithms.`,
      `Why? Because a scrambled Rubik's cube has 4.3 × 10¹⁹ (43 quintillion) possible states — more than the number of seconds that have passed since the big bang.`,
      `The focus of this project and article is the neural network, training and most importantly, learning (both machine and personal!), so let's get one of the coolest elements of the project out of the way first.`
    ]},
    {h:'The Lego robot',paras:[
      `The robot in the photo is the incredible creation of David Gilday, an engineer at ARM and robot enthusiast. The build is based on Lego Set 51515 — Mindstorms Robot Inventor, a set which I fortunately bought for my son Henry a few years ago. The instructions provided with the Mindcuber build are good, so the robot was built, calibrated and performing its tricks to the amazement of my family in under 3 hours.`,
      `The base controller runs MicroPython and the mindcuber project includes a neat programme which scans the cube using a colour recognition sensor, computes the required moves to solve, then executes by rotating the cube in a basket, flipping as needed so that the required face can be rotated. The only notable limitation is that the robot can only rotate a single face (the face in the basket).`
    ]},
    {h:'Defining the problem',paras:[
      `With the baseline robot built and tested I could move onto the project itself. In previous projects I have used various models in different ways, but this was my first attempt at creating one from scratch. The intention, apart from being very cool in its own right, is that it is the next logical stepping stone on the learning path to building my own LLM on the DGX Spark.`,
      `The first step is to create structure around the problem. For the Rubik's cube this is straightforward and there are only 3 key things to define: what does the input look like, what does the network need to output, and what does correct mean?`,
      `The input to the network is simple: a current state representation of the cube. A 3×3 Rubik's cube has 6 different colours, 6 faces and 9 stickers per face, giving 324 input values representing the 54 stickers. These need to be encoded as numbers and shaped into a tensor. The correct way to do this is using one-hot encoding: each colour is represented as a 6-digit array of zeros and ones.`,
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
      `There are 12 possible moves on a Rubik's cube. These are normally written as F (turn front face clockwise), F' (front anticlockwise), etc. The Policy Head therefore outputs 12 raw logits. At inference time, these are normalised using softmax as probability scores which add up to 1 — in one sample output, F' and D' came out on top at 22% each, followed by B' at 15% and U at 12%.`,
      `So our policy head output tensor is shape: (12,). The value head is given as a single value, shape: (1,).`
    ],table:{caption:'Example policy head output for the 12 possible moves',headers:['Move','F',"F'",'B',"B'",'L',"L'",'R',"R'",'U',"U'",'D',"D'"],rows:[['Probability','0.03','0.22','0.02','0.15','0.03','0.02','0.06','0.04','0.12','0.02','0.07','0.22'],['Percentage','3%','22%','2%','15%','3%','2%','6%','4%','12%','2%','7%','22%']]},code:`# Policy head: predicts best move (12 possible moves)
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
      `The first layer maps the 324 input values representing 54 stickers to 4,096 internal values. These values are learned representations; I have not analysed them well enough to say which patterns they encode.`
    ]},
    {h:'Residual blocks — the black box',paras:[
      `The network then has 4 residual blocks of 2048 neurons, the core layers of the 'black box' where learning takes place. A residual block is a pair of layers with a skip connection. In a normal network, each layer passes its output only to the next layer — if that layer makes a poor transformation, the original information is lost. A skip connection solves this by adding the block's input directly to its output: output = f(x) + x.`,
      `That "+ x" is the skip connection. It has two benefits. First, if the layers have nothing useful to add, they can learn to output near-zero and the input passes through untouched — it is easier to learn what to change than what the complete answer should be. Second, it creates a direct highway for the learning signal to travel backward during training, solving the vanishing gradient problem where signals fade to nothing in deep networks.`,
      `The main benefit here is gradient flow: the skip connection gives the learning signal a direct path backward through the block, which keeps the deeper layers trainable. Skip connections require the input and output to be the same size (2048), which is why the input projection compresses to 2048 before the residual blocks begin. Each block contains two linear layers, so our four residual blocks give us eight layers of processing, all with stable gradient flow.`,
      `Our next block is the Output Projection. It takes the 2048 outputs from the final residual block and compresses them down to 512 neurons, distilling the network's internal representation into a compact form for the two heads. The final blocks are therefore our 2 heads: the Value Head (512 → 256 → 1 single value of 'moves until solved') and the Policy Head (512 → 256 → 12 raw scores for the next best move, converted to probabilities using softmax at inference time).`
    ]},
    {h:'Training from random scrambles',paras:[
      `Before training, the network has not learned useful move or distance predictions.`,
      `I generated training examples by working backwards from the solved state. The original write-up calls this Autodidactic Iteration, but the description here establishes scramble-based targets only; confirming that label requires the training implementation.`,
      `The logic: start with a solved cube and apply random moves up to a chosen scramble length, then record the final cube state, the scramble length (an upper bound on the distance to solved, not necessarily the shortest distance), and the inverse of the last move (one valid first reversal move, not necessarily the first move of a shortest solution).`,
      `I trained on 20 million random samples with scrambles of up to 20 quarter turns. The well-known 20-move bound uses the half-turn metric, where a half turn counts as one move. This network’s 12 actions are quarter turns, so that bound does not apply directly to its action set.`,
      `Each training step followed the same four-stage process: a forward pass feeds a batch of cube states through the network and collects the predictions; loss calculation compares the predictions against the true labels using MSE for the value head and cross-entropy for the policy head; the backward pass calculates how much each parameter contributed to the error via backpropagation, which PyTorch handles automatically; and the update step adjusts every parameter slightly in the direction that reduces the error, handled by the optimiser.`,
      `PyTorch handles backpropagation, the gradient calculations, and the parameter updates. The complexity is hidden inside loss.backward(), which traces back through all 15 layers and 44.6 million parameters. The Adam optimiser adapts the learning rate for each parameter individually — parameters that need larger adjustments get larger steps, and vice versa. The initial learning rate was 0.001 and it halved every 10 epochs, gradually reducing the step size as the network got closer to a good solution.`
    ]},
    {h:'Scale and duration',paras:[
      `The training ran on the DGX Spark (GB10 GPU). The 20 million training samples were divided into batches of 1024 cubes and fed through the network repeatedly. One complete pass through all 20 million samples (an epoch) took about 25 minutes. The network was trained for 100 epochs, meaning every one of the 20 million training cubes was seen by the network 100 times. In total, the network processed 2 billion cube states during training — sounds like a lot, but remember the 43 quintillion number we are up against. The entire training run took approximately 42 hours.`
    ]},
    {h:'Results',paras:[
      `Every 10 epochs, we paused training and tested the network on 100 freshly scrambled cubes at different difficulty levels. At the best checkpoint (epoch 10): 5-move scrambles solved at 100% (avg. 4.9 moves), 10-move scrambles at 100% (avg. 9.9 moves), 15-move scrambles at 59% (avg. 19.2 moves), and 20-move scrambles at 37% (avg. 27.4 moves).`,
      `The network quickly became perfect at easy cubes (5 and 10 moves). For harder scrambles it struggled — 37% on 20-move scrambles was the best that I achieved.`,
      `One interesting observation: the best results on 20-move cubes came at epoch 10, not at epoch 100. The total loss continued to fall throughout training (from 8.64 to 5.05) but the solve rate on the hardest cubes did not improve. The value loss dropped steadily (6.99 → 3.62), meaning the distance predictions became more accurate, but the policy loss barely moved (1.65 → 1.43), meaning the move predictions did not improve much after the first few epochs.`,
      `This suggests the network learned to estimate distance well but found it much harder to learn which specific move to make next. That makes intuitive sense: predicting "this cube is about 12 moves from solved" is an easier problem than predicting "the next move should be F'" from 12 possible options.`
    ],table:{caption:'Solve rates at epoch 10',headers:['Scramble depth','Solve rate','Average moves to solve'],rows:[['5 moves','100%','4.9'],['10 moves','100%','9.9'],['15 moves','59%','19.2'],['20 moves','37%','27.4']]},figure:{src:'beam-search.png',alt:'Beam search training simulation',caption:'Fig. 1 — Original figure label: ADI v3 training simulation · beam width 1,800 · max depth 30'},after:`The 37% solve rate on 20-move scrambles, while far from perfect, was enough for the robot. In practice, the beam search algorithm — which explores multiple possible move sequences in parallel — compensates for imperfect move predictions, and the robot successfully solved 19 out of 19 cubes during testing. The result looks identical to the original robot that uses the simple scan-and-solve Python programme, and achieves the same result.`},
    {h:'What did the network learn?',paras:[
      `However, here's the thing… despite all the explanation and theory above, we cannot explain how the JoeCube44m neural network solves the cube. I fed a neural network with 324 numbers, showed it 20m example cubes with one single next move and the correct distance to solve, and it learned. Did it learn the algorithms that human experts like Teodor Zajder use to solve cubes? Highly unlikely. Remember, we did not even tell the network that the physical object in the robot is a cube.`,
      `The network successfully solved all 19 of the cubes I scrambled using patterns it learned in layers of weighted numbers that may never translate to anything logical to humans. The solve results show that it learned useful predictions. I haven’t analysed the hidden representations well enough to say which patterns it uses. And this is why I will never look at my mindcuber robot the same again.`
    ]}
  ]},
  {id:'abliteration',no:'03',tag:'INTERPRETABILITY',date:'AUG 2026',read:'13 MIN',title:'Removing a refusal direction from an open-weight model',dek:"I tested whether removing a direction from a model’s internal activations reduced refusal. On the reported set of 100 harmful prompts, refusals fell from 100 to 6.",file:'abliteration.pdf',fileLabel:'Read the article (PDF)',links:[{label:'Arditi et al., Refusal in Language Models Is Mediated by a Single Direction (NeurIPS 2024)',href:'https://proceedings.neurips.cc/paper_files/paper/2024/hash/f545448535dfde4f9786555403ab7c49-Abstract.html'}],sections:[
    {h:'The residual stream',paras:[
      `This project is yet another side-quest from my plan to build and train an LLM from scratch, however, after reading about 'abliteration' and doing some research, I decided that the associated learning would be worth the time investment. As a result, this article is focused on the theory but I have tried my best to keep it readable.`,
      `Inside a transformer model, every token is represented as a vector, basically a long ordered list of numbers. In the model I used, this vector has 12,288 BF16 (16-bit) numbers, so each token is represented by a ~24KB number. Every token has its own 12,288-wide vector. For example, a 50-token prompt has 50 vectors of width 12,288 flowing through the layers. This per-token vector is called the token's residual stream, and as it flows through the model's layers (88 of them in this case), the model reads the current set of 12,288 numbers, passes them through several weight matrices and adds the result back to the residual stream.`,
      `This journey allows the model to understand context, and the final values after all 88 layers are what the model uses to decide what to say next (the next token).`
    ]},
    {h:'Diving deeper into the 88 layers — attention & MLP',paras:[
      `Each of the 88 layers is made up of 7 weighted matrices split into 2 blocks.`,
      `The attention block first uses three matrices — q_proj, k_proj, and v_proj — to turn each token's vector into three specialised vectors that can be thought of as a query ("what am I looking for?"), a key ("what do I offer to the query?") and a value ("what will I add if selected?"). The model compares queries against keys across every token in the current sequence to decide which tokens should pay attention to which.`,
      `This is the step where the model can take a word like 'it' and reach back and pull in information from the noun it refers to. The gathered result is then passed through a fourth matrix, o_proj, which produces the attention block's contribution to add back onto the residual stream.`,
      `The MLP block is where most of the raw computation happens. It first uses two matrices — up_proj and gate_proj — to expand the 12,288 numbers into a much wider 49,152-number space (four times larger), applies a nonlinear function that lets the model represent more complex relationships, and then uses a third matrix, down_proj, to compress the result back down to 12,288 numbers, which it then adds back to the residual stream.`,
      `One key point: of the 7 matrices named above, o_proj and down_proj are the only two that write to the residual stream. For this reason they are often referred to as write heads.`
    ],figure:{src:'abliteration-figure-000.png',crop:'layer',alt:'Transformer layer diagram showing attention and MLP blocks and their write heads',caption:'Figure 1 — Architecture of a transformer layer illustrating attention and MLP blocks and abliteration write heads.'}},
    {h:'The search for meaning, behaviour and refusal',paras:[
      `The numbers in the matrices have no human meaning; they are abstract coordinates in a very high dimension mathematical space. We cannot assign definitions within the 12,288 numbers and simply read our way through the model to understand behaviour.`,
      `Meaning is instead encoded in patterns across many coordinates at once, so it is best described as direction through the 12,288-dimension space. This direction is also a 12,288 vector, but the numbers are relative (to the origin), whereas coordinates are absolute. Think of a coordinate as a point in the space, and a direction as an arrow from the origin.`,
      `This direction is the phenomenon that we are interested in — it represents what the model has learned, both its understanding of meaning and its learned behaviour. Behaviour is the important concept. A model learns behaviour in two ways: firstly, it loosely learns subconsciously through the implicit human norms (politeness, formality, refusal etc) in the internet text used in training. Secondly, and more importantly, companies invest billions in alignment training (reinforcement learning from human feedback, supervised fine-tuning and 'constitutional AI', where written policies are encoded into the model).`,
      `The most fundamental trained behaviour, and that which we are interested in for this project, is the model's refusal to respond to a range of nefarious, dangerous or unethical requests.`,
      `Given the huge scope of training, the massive number (12,288) of dimensions inside of the model, and thus the infinite number of possible directions, it would be normal to expect that the directions which trigger refusal are scattered across many different paths. However, a major 2024 paper by Arditi et al. found that refusal behaviour could be changed by intervening along a single direction in each of the models they studied.`
    ],after:`"Refusal is mediated by a one-dimensional subspace, across 13 popular open-source chat models up to 72B parameters in size. Specifically, for each model, we find a single direction such that erasing this direction from the model's residual stream activations prevents it from refusing harmful instructions." — Arditi et al., 2024`},
    {h:'Finding the refusal direction — two clouds of dots',paras:[
      `In the models studied by Arditi et al., interventions along a candidate direction changed refusal behaviour. This supports studying behaviours through directions in activation space, but does not establish that every behaviour has one isolated direction or that removing it eliminates every refusal.`,
      `The refusal direction does not come pre-labelled inside the model. It has to be calculated from evidence. The method is called difference of means: create two sets of prompts, 400 harmful or refusal-triggering, and 400 similar but harmless ones. Run both sets through the model, but instead of reading the output, capture the internal state of the 12,288 directional vector at target layers for the last token of each prompt.`,
      `No weights are changed during this step. It is purely an observational pass to capture how the model's internal state differs when processing a harmful request versus a harmless one.`,
      `To capture this internal state we go into the model and record the 12,288 vector of the last token position from the residual stream at one of the 88 layers (e.g. layer 40). The last token in the stream is the most important, because it has 'seen' the entire prompt thanks to attention processing in previous layers, and is closest to what the model is going to say next — so if the model is about to refuse, that behaviour will be clearest in the last token.`
    ]},
    {h:'Computing the direction',paras:[
      `This gives us two centre-of-mass vectors, and the refusal direction is just the difference between the two (coordinate by coordinate): r_raw = mean_harmful − mean_harmless.`,
      `The resulting 12,288 vector points from the 'this is harmless' state towards the 'I am going to refuse' state. The last step is to normalise the vector to unit length — dividing all 12,288 values by the vector's overall (Euclidean) length so that the whole vector has a length of 1. This keeps the direction of refusal while discarding the magnitude, since we are interested in the direction of refusal, not the amount of it.`
    ],figure:{src:'abliteration-figure-001.png',crop:'clusters',alt:'Harmless and harmful activation clusters separated by a refusal direction vector',caption:'Figure 2 — Harmless and harmful activation clusters at layer 40, separated by the unit refusal vector.'},code:`Create two sets of prompts, 400 harmful or refusal-triggering, and 400 similar but
harmless ones. Run each prompt forward through the model. At layer 40, capture the
12,288 number vector sitting at the final token position.

for each coordinate i = 1... 12,288
   mean_harmful[i]  = (v_1[i] + v_2[i] + ... + v_400[i]) / 400
   mean_harmless[i] = (v_1[i] + v_2[i] + ... + v_400[i]) / 400

r_raw = mean_harmful − mean_harmless
r̂ = r_raw / ‖r‖   where ‖r‖ = √(r_1² + r_2² + ... + r_12288²)`,lang:'DIFFERENCE OF MEANS'},
    {h:'Removing the component along a direction',paras:[
      `Vector projection measures the component of an activation a along the unit direction r̂. Subtracting (r̂ · a)r̂ removes that component and preserves components perpendicular to it in this vector. Later computation and behaviours other than refusal can still change.`,
      `The dot product r̂ · a is the signed component of activation a along the unit direction r̂. It depends on the activation’s length as well as its angle to r̂. It equals cosine similarity only when a is also unit length; the coefficient alone does not establish whether the model will refuse.`
    ],code:`a_reduced = a − (r̂ · a) × r̂

where (r̂ · a) is the dot product resulting in a single scalar, ie
(r̂ · a) = (r̂_1 × a_1) + (r̂_2 × a_2) + (r̂_3 × a_3) + ... + (r̂_12288 × a_12288)`,lang:'THE ABLATION'},
    {h:'A worked example',paras:[
      `A worked example using a 3-dimensional vector: the activation before the intervention is [3, 1, 1], and the candidate direction is r̂ = [2/3, 2/3, 1/3]. The result [1, −1, 0] is the activation with the component along that direction removed — whether that removes refusal in a real model must be measured, not assumed. We need to calculate accurately and not touch the rest of the activation.`
    ],code:`r̂ = [2/3, 2/3, 1/3]
Activation a = [3, 1, 1]

Step 1 — calculate dot product:
  r̂ · a = (2/3 × 3) + (2/3 × 1) + (1/3 × 1)
        = 2 + 2/3 + 1/3
        = 3 (component along the candidate direction)

Step 2 — rebuild the component along r̂ (× r̂):
  3 × [2/3, 2/3, 1/3] = [2, 2, 1]

Step 3 — remove that component:
  a_reduced = [3, 1, 1] − [2, 2, 1] = [1, −1, 0]`,lang:'WORKED EXAMPLE'},
    {h:'Implementing the surgery',paras:[
      `To 'implement' the brain surgery, we adjust the model's weights by precisely the calculated amount (software optimisation tools can do this easily). The account names o_proj and down_proj in each of 88 layers, which accounts for 176 matrices. The original article reports 178 edits; the implementation is needed to identify any additional matrices.`,
      `These edits prevent the named matrices from writing a component along r̂. That geometric constraint does not guarantee a particular response: on my reported test sample, refusals dropped from 100/100 to 6/100 harmful requests.`,
      `KL divergence compares next-token probability distributions from the base and modified models on the same contexts. It is non-negative and has no upper bound of 1. A small value on sampled contexts does not establish unchanged capabilities. The original write-up does not provide a KL value or enough detail about the comparison to assess that here.`
    ]},
    {h:'The end product — scary and of no use to me',paras:[
      `I ran the resulting model on the DGX Spark with a vibed UI. In a few demos to family and friends the result has been the same: shock and disbelief. The model's constructive and carefree response to any prompt quickly makes me squeamish about using it — I have no use for such a tool, nor do I want to make it available for anyone else, although many abliterated models are freely available.`,
      `These observations concern refusal on the tested prompts. I did not evaluate the model’s ability to carry out cyber attacks or other harmful tasks, so the refusal result alone cannot establish those risks.`
    ]}
  ]},
  {id:'nvfp4',no:'02',tag:'QUANTISATION',date:'JUN 2026',read:'11 MIN',title:'NVFP4 quantisation of Mixtral 8×7B',dek:'I quantised Mixtral on the DGX Spark. The weights got smaller, but software compatibility problems prevented inference tests of the quantised model.',file:'nvfp4-quantization-mixtral.pdf',fileLabel:'Read the article (PDF)',links:[{label:'Quantised weights on Hugging Face',href:'https://huggingface.co/josephdowling10/Mixtral-8x7B-Instruct-v0.1-NVFP4'},{label:'TensorRT Model Optimizer documentation',href:'https://nvidia.github.io/TensorRT-Model-Optimizer/'}],sections:[
    {h:'Why quantise?',paras:[
      `This weekend's hobby project is something I have been keen to try for a while: exploiting one of the bleeding-edge features of the GB10B chip, NVFP4, with the 'bleeding-edge' bit ultimately coming back to bite me when trying to test the results.`,
      `The project may sound complex on the face of it, but is actually relatively simple to execute and explain. Modern LLMs are built on the transformer architecture and consist of embedding layers (which convert text tokens into numerical vectors), attention mechanisms (which allow the model to focus on relevant parts of the input), feed-forward networks (which process and transform these representations), and output layers (which predict the next token).`,
      `Each of these components contains millions or billions of weight parameters. For example, Mixtral 8×7B contains approximately 46.7 billion parameters across its 8 expert networks. These parameters are stored as floating-point numbers, and most modern LLMs, including Mixtral 8×7B, are distributed in BF16 format.`,
      `46.7 billion parameters at two bytes each require about 93.4 GB (87 GiB) for the weights alone, before runtime overhead such as the key-value cache.`
    ]},
    {h:'The memory problem',paras:[
      `This presents a practical problem. Most modern GPUs have 24-80GB of memory, and even high-end workstations struggle to run these models efficiently. Even the DGX Spark, a purpose-built edge device, has 128GB, so loading Mixtral as distributed is really pushing the limits. (Side muse... I can connect 2 Sparks together using a special QSFP cable to get 256GB... surely I can justify this? Maybe I can ask Mrs Dowling for another DGX Spark for Christmas?)`,
      `The solution (other than buying more hardware) is quantisation: the process of reducing the precision of model weights from higher-bit representations (like BF16) to lower-bit representations (like INT4 or NVFP4). The goal is to dramatically reduce memory requirements while minimising the impact on model quality.`
    ]},
    {h:'Linear quantisation',paras:[
      `In its simplest form, linear quantisation maps continuous floating-point values to a discrete set of values that can be represented with fewer bits, using the transformation q = round(x / scale), where q is the resulting quantised integer, x is the original floating-point value, and scale determines the step size between quantised values.`,
      `For example, for 8-bit symmetric quantisation with a scale of 1/127, a weight of 0.5 is stored as code 64 and reconstructed as ≈ 0.503937008 — a rounding error of ≈ 0.003937008 on that one weight.`
    ],code:`Symmetric signed INT8: codes -127 to 127
scale = 1 / 127 ≈ 0.007874016
Round to nearest; exact ties away from zero.
Use the exact scale throughout; decimals below are display values.
x = 0.5
q = round(0.5 / (1/127)) = round(63.5) = 64
reconstructed = 64 / 127 ≈ 0.503937008
signed error (x - reconstructed) ≈ -0.003937008
absolute error ≈ 0.003937008`,lang:'LINEAR QUANTIZATION'},
    {h:'4-bit quantisation — the challenge',paras:[
      `Four bits allow 16 codes; this symmetric example uses 15 of them, leaving −8 unused: the same weight of 0.5 is reconstructed as ≈ 0.571428571, an order of magnitude larger error than the 8-bit example. These examples show rounding error for one weight. They do not measure model quality. INT8 uses half as many weight bits as BF16 and INT4 uses a quarter, before scales and other overhead.`
    ],code:`Symmetric signed INT4: codes -7 to 7 (-8 unused)
scale = 1 / 7 ≈ 0.142857143
Round to nearest; exact ties away from zero.
x = 0.5
q = round(0.5 / (1/7)) = round(3.5) = 4
reconstructed = 4 / 7 ≈ 0.571428571
signed error (x - reconstructed) ≈ -0.071428571
absolute error ≈ 0.071428571`,lang:'4-BIT'},
    {h:'The project',paras:[
      `Mixtral 8×7B Instruct is a MoE model that (roughly 93 GB, or 87 GiB, of weights as distributed) is large enough to demonstrate quantisation benefits whilst just squeezing onto a single DGX Spark! The 'Mixture of Experts' architecture provides an interesting test case: only 2 of the 8 experts are active for any given token, making the effective parameter count during inference closer to 13B — however, all 46.7B parameters must still be loaded into memory.`,
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
      `The perplexity benchmark evaluates Mixtral's ability to predict a sequence of words during inference. A lower score means the model has assigned higher probability to the next token, theoretically indicating how well the model 'understands' the prompt. This is a key test for our quantisation; we want to see gains in speed and size reduction, without increasing the perplexity score.`,
      `Huggingface provides a script which loads the WikiText-2 test set from the datasets library. It concatenates all the text into a single string and tokenizes it, then for each window (size 2048 tokens) extracts a chunk of input tokens and predicts the likelihood of the next tokens, calculating the prediction errors (negative log-likelihood, or NLL). Finally it calculates the average of all the prediction errors, and uses that number to calculate the perplexity.`
    ]},
    {h:'Running the quantisation',paras:[
      `The NVFP4 quantisation process uses the TensorRT Model Optimizer from Nvidia's TensorRT library. Note the process used by TensorRT is more complex than the linear quantisation examples given above — it involves calibration data run through a forward loop rather than a single static formula.`,
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
      `This is the frustrating bit... Quantisation worked! The output model reduced in size broadly in line with expectations. But when coming to load the quantised model into memory, the dependency errors started.`,
      `The source labels both sizes “GB”, but does not establish whether decimal GB or binary GiB was used. The 24.82 figure and the reported compression comparison need the original measurement records before they can be treated as verified storage measurements.`
    ],code:`Size: BF16 Baseline = 87GB, NVFP4 Quantized = 24.82GB
Compression Ratio: 3.5x
Reduction: 71%
Quantization Time: 5h 46mins
Tokens/sec: BF16 = 4.05, NVFP4 = ?
Perplexity: BF16 = 3.7, NVFP4 = ?`,lang:'ORIGINAL REPORTED RESULTS'},
    {h:'When it all fell apart',paras:[
      `30 minutes of searching, finding nothing, and hacking around could have been saved as Gemini promptly explained why the loading was failing.`,
      `TensorRT itself provided its own warning, and Nvidia are not the only ones to blame — PyTorch only added to the inevitable mothballing by refusing to recognise the GB10's CUDA capability.`
    ],code:`WARNING: Detected NVIDIA GB10 GPU, which may not yet be supported in this version
of the container

Found GPU0 NVIDIA GB10 which is of cuda capability 12.1.
Minimum and Maximum cuda capability supported by this version of PyTorch is
(8.0) - (12.0)`,lang:'ERRORS',after:`"NVFP4 quantization produces weights in a packed format that requires specialized CUDA kernels to unpack and execute. These packed weights cannot be loaded by standard HuggingFace transformers — they require inference engines with native FP4 kernel support." — Gemini, explaining what 30 minutes of searching hadn't. This was Gemini’s troubleshooting explanation during the June 2026 experiment. The recorded errors establish a compatibility problem in the versions used then; they do not establish current support. Version-specific guidance should be checked against the library documentation.`},
    {h:'Conclusion',paras:[
      `So that is where I left it. The quantised output weights are uploaded to Hugging Face (linked under the article heading) for anyone who wants to try them. Inference with the quantised weights was not benchmarked, so whether the smaller weights preserve speed and quality in this environment remains untested.`
    ]}
  ]},
  {id:'haskell',no:'01',tag:'AGENTS',date:'APR 2026',read:'10 MIN',title:'Building a multi-agent workflow in Haskell',dek:'Three local models debate a topic through a Haskell program. The article covers message types, state and the host that introduced the wrong debate.',file:'multi-agent-haskell.pdf',fileLabel:'Read the article (PDF)',sections:[
    {h:'Why Haskell',paras:[
      `I was introduced to Haskell by a tutor leading a CS course, 'Algorithms and Data Structures'. Despite the fact that 9 months of course material was all written using Python, the tutor opened the first lecture by dismissing it as rubbish and proceeded to teach the entire course using Haskell. After a very confusing first couple of months (no iteration, no variables and a compiler stricter than a Dickensian headmaster), supplemented by a few hundred quid on World of Books, the penny dropped. Haskell is cool! Limited? Definitely. Widely used? No. Of career benefit? No. But who cares — it's not Python, and that makes it cool.`,
      `Haskell is a purely functional programming language. The basic adage is, a Haskell programme describes what result you want, rather than specifying how to compute it step by step. It is statically typed with powerful type inference and absolute immutability — pure functions return the same result for the same arguments, although the complete program performs I/O and calls models, so runs can differ. The initial learning challenge is getting over the loss of iterative loops (counters are mutable, so are illegal in pure functions). This drives a completely different way of thinking, structuring functions based on recursion. The result being, arguably, actually quite elegant!`,
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
    {h:'Typed messages between agents',paras:[
      `Although Python dominates the AI landscape, Haskell's strengths align well with the challenges of agent orchestration. In a multi-agent system, messages flow between components with specific structures. Haskell's type system ensures that an A2A-style message always contains the required fields once it is parsed — although external JSON still needs parsing and validation at the boundary, and a well-typed message does not guarantee meaningful content.`,
      `The idea for the app was to create 3 agents and 1 facilitator using different LLMs and trigger a debate between them (yes, this has been done a million times before I am sure, but perhaps not with Haskellian agents!). I used A2A-style messages, which were passed between agents as JSON files and converted to Ollama's own prompt format.`
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
      `IO is the monad here; it describes the I/O actions that the runtime executes, and the 'do' notation lets you sequence these actions (I asked if this was effectively imperative code, but was swiftly assured that it is not — although I am still trying to get my head round why not!). The manager utility is from the Haskell lib Network.HTTP.Client, which is pretty much the same as the requests lib in Python. toOllamaMsgs converts the A2A-style message to Ollama's format, agentCardText is the simplified A2A-style Agent Card that I use (agents currently don't have any tools — the reality is that Python beats Haskell hands down when it comes to the simplicity of creating MCP), and history is the cumulative history of the debate, so that the agents can make arguments with context.`
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
      `The debate was actually interesting. Here is the opening gambit from the Philosopher — generated by the model, quoted as part of the experiment:`
    ],after:`Philosophically, we must question whether the integration of AI aligns with Aristotelian ideals of eudaimonia — human flourishing — or if it leads to a form of instrumentalism where individuals are seen merely as data points for optimization. The Kantian notion of treating individuals as ends in themselves, rather than means to an end, is particularly relevant here. If AI systems make decisions that override human autonomy or if they perpetuate biases embedded within their training data, we risk undermining the dignity and rights of individuals.`}
  ]}
];
const models=[
  {name:'mindcuber-rl',version:'v3',status:'Training experiment',cls:'lime',article:'mindcuber',desc:"Rubik's cube network with policy and value heads, explored through training and search. The browser demonstration replays a scramble reversal.",note:'The original article reports 44.6M parameters; an earlier registry entry said 44.7M. The saved architecture is needed to confirm the exact count.',specs:[['Parameters','44.6M reported'],['Architecture','ResNet, dual head'],['Input','324 one-hot'],['Reported @ 20','37 / 100']]},
  {name:'mixtral-8x7b-nvfp4',version:'v1',status:'Quantised weights',cls:'purple',article:'nvfp4',url:'https://huggingface.co/josephdowling10/Mixtral-8x7B-Instruct-v0.1-NVFP4',urlLabel:'Weights on Hugging Face ↗',desc:'Mixtral 8×7B Instruct quantised to 4-bit NVFP4 on GB10 hardware.',specs:[['Parameters','46.7B'],['Format','NVFP4'],['BF16 size','~93 GB'],['Experts','8']]},
  {name:'a2a-council',version:'v0.2',status:'Agent program',cls:'amber',article:'haskell',desc:'Typed multi-agent workflow in Haskell, with agents communicating over A2A-style messages.',specs:[['Philosopher','Qwen 2.5 32B'],['CEO','Llama 3.1 70B'],['Runtime','Ollama'],['Language','Haskell']]},
  {name:'refusal-ablated',version:'128B',status:'Write-up only',cls:'quiet',article:'abliteration',desc:'An experiment in reducing refusal by removing a direction from the residual stream. I’m not distributing the modified weights.',specs:[['Layers','88'],['d_model','12,288'],['Method','Ablation'],['Access','None']]}
];
const nav=[['home','Home'],['research','Research'],['lab','Lab'],['maths','Maths'],['models','Models'],['about','About']];
const app=document.querySelector('#app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function route(){const p=location.hash.slice(1).split('/');return {page:p[0]||'home',id:p[1]||''}}
function href(to){return '#'+to}
function home(){
  return Field.home(articles);
}
function research(){
  return Field.research(articles);
}
function articleTable(table){return `<div class="article-table-wrap"><table class="article-table"><caption>${esc(table.caption)}</caption><thead><tr>${table.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row=>`<tr>${row.map((cell,i)=>i===0?`<th scope="row">${esc(cell)}</th>`:`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function articleFigure(figure){return `<figure class="${figure.crop?`figure-crop figure-crop-${esc(figure.crop)}`:''}"><div><img src="/assets/${esc(figure.src)}" alt="${esc(figure.alt)}" loading="lazy"></div><figcaption>${esc(figure.caption)}</figcaption></figure>`}
function articlePage(a){
  const i=articles.indexOf(a),next=articles[(i+1)%articles.length];
  const sections=a.sections.map((s,j)=>`<section id="section-${j}"><h2><small>§${String(j+1).padStart(2,'0')}</small>${esc(s.h)}</h2>${s.paras.map(p=>`<p>${esc(p)}</p>`).join('')}${s.table?articleTable(s.table):''}${s.code?`<pre><span>${esc(s.lang)}</span>\n${esc(s.code)}</pre>`:''}${s.figure?articleFigure(s.figure):''}${s.after?`<blockquote>${esc(s.after)}</blockquote>`:''}</section>`).join('');
  const links=(a.links||[]).map(l=>`<a class="text-link" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join(' · ');
  return `<article class="page article-page"><a class="text-link" href="#research">← Index</a><header class="article-head"><div class="article-kicker"><span>${a.no} / ${a.tag}</span><span>${a.date}</span><span>${a.read} read</span></div><h1>${esc(a.title)}</h1><p class="page-intro">${esc(a.dek)}</p><div class="article-actions"><a class="button primary" href="/articles/${a.file}" ${a.file.endsWith('.pdf')?'target="_blank" rel="noopener"':''}>${esc(a.fileLabel)} ↗</a><a class="button" href="/articles/${a.file}" download>Download source</a></div>${links?`<p class="article-links">${links}</p>`:''}<p class="article-note">This web version includes editorial and technical corrections made on 24 October 2026. The download is the original article and may differ.</p></header>${a.id==='mindcuber'||a.id==='nvfp4'?`<div class="article-lab-link"><a class="button" href="#lab/${a.id==='nvfp4'?'quantization':'mindcuber'}">Try the interactive experiment →</a></div>`:''}<div class="article-layout"><div class="prose">${sections}<a class="next-article" href="${href('article/'+next.id)}"><small>Next · ${next.no} · ${next.tag}</small><b>${esc(next.title)} →</b></a></div><aside class="toc"><h2>Contents</h2>${a.sections.map((s,j)=>`<a href="#section-${j}"><span>${String(j+1).padStart(2,'0')}</span>${esc(s.h)}</a>`).join('')}<a href="/articles/${a.file}" target="_blank" rel="noopener"><span>↗</span>Original article</a></aside></div></article>`
}
function modelsPage(){return `<section class="page model-page"><div class="page-index">[02] Models · research registry</div><h1 class="page-title">Models & experiments.</h1><p class="page-intro">Models used or produced in these projects. The entries describe their status and link to the relevant write-up. You can’t run these models on this website.</p><div class="model-registry">${models.map(m=>`<article class="model-item"><div class="model-state"><span class="${m.cls}"><i></i>${m.status}</span><span>${m.version}</span></div><h3>${m.name}</h3><p>${esc(m.desc)}</p><div class="model-specs">${m.specs.map(s=>`<span><small>${s[0]}</small>${s[1]}</span>`).join('')}</div>${m.note?`<p class="model-note">${esc(m.note)}</p>`:''}<div class="model-links">${m.article?`<a class="text-link" href="${href('article/'+m.article)}">Read the article →</a>`:''}${m.url?`<a class="text-link" href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.urlLabel||'Model repository ↗')}</a>`:''}</div></article>`).join('')}</div><div class="lab-next"><div><h2>Explore Mindcuber</h2><p>Turn the cube, step through a scramble reversal and inspect the reported training results.</p></div><a class="button primary" href="#lab/mindcuber">Open the experiment →</a></div></section>`}
function aboutPage(){return `<section class="page"><div class="page-index">[03] About</div><h1 class="page-title">Inside the room.</h1><div class="about-grid"><div class="about-visual">${Field.art('surface','dark',{alt:'A mathematical surface, drawn as a wire mesh'})}</div><div class="about-copy"><h2>About Joe</h2><p>My longer-term aim is to build and train a language model from scratch. The projects here cover things I’m learning along the way: training a cube-solving network, reducing model memory use, and inspecting internal representations.</p><p>I run these experiments on a DGX Spark and write up what happened, including the attempts that didn’t work.</p><div class="setup-grid">${[['Hardware','NVIDIA DGX Spark · GB10 · 128 GB'],['Long project','An LLM built and trained from scratch'],['Interests','Interpretability, quantisation, RL, agents'],['Contact','hello@chineseroom.io']].map(x=>`<div class="setup"><small>${x[0]}</small><b>${x[1]==='hello@chineseroom.io'?`<a href="mailto:${x[1]}">${x[1]}</a>`:x[1]}</b></div>`).join('')}</div></div></div></section>`}
let lastRoute = null;
function render(initial=false){
  const r = route();
  let page = r.page;
  if(!['home','research','article','lab','maths','models','about'].includes(page)) page = 'home';
  document.body.dataset.page = page;
  const navPage = page==='article' ? 'research' : page;
  document.querySelectorAll('.topbar nav .nav-link,.mobile-menu .nav-link').forEach(x=>{
    const on = x.dataset.page===navPage;
    x.classList.toggle('active',on);
    if(on) x.setAttribute('aria-current','page'); else x.removeAttribute('aria-current');
  });
  Lab.wire(null);
  Maths.wire(false);
  Interiors.wire(null);
  if(page==='article'){
    const a = articles.find(x=>x.id===r.id)||articles[0];
    app.innerHTML = articlePage(a);
    document.title = `${a.title} — Chinese Room`;
  }else if(page==='lab'){
    app.innerHTML = Lab.page(r.id);
    document.title = (r.id==='mindcuber'?'Mindcuber lab':r.id==='quantization'?'Quantisation lab':'The lab')+' — Chinese Room';
  }else if(page==='maths'){
    app.innerHTML = r.id==='play' ? Interiors.page(location.hash.split('/')[2]) : Maths.page();
    document.title = (r.id==='play'?((g=>g?`${g.maths} · ${g.title}`:'Interiors')(Interiors.games.find(g=>g.id===location.hash.split('/')[2]))):'The Maths of AI')+' — Chinese Room';
  }else if(page==='research'){
    app.innerHTML = research();
    document.title = 'Research — Chinese Room';
  }else if(page==='models'){
    app.innerHTML = modelsPage();
    document.title = 'Models — Chinese Room';
  }else if(page==='about'){
    app.innerHTML = aboutPage();
    document.title = 'About — Chinese Room';
  }else{
    app.innerHTML = home();
    document.title = 'Chinese Room — AI project notes';
  }
  Field.wire();
  wirePage();
  Lab.wire(page==='lab'?r.id:null);
  Maths.wire(page==='maths'&&r.id!=='play');
  if(page==='maths'&&r.id==='play')Interiors.wire(location.hash.split('/')[2]);
  document.querySelector('#nav-sweep').style.width = '0%';
  closeMenu();
  const wasPlay = lastRoute === 'play';
  lastRoute = r.id === 'play' ? 'play' : page;
  window.scrollTo({top:0,behavior:'instant'});
  if(!initial){
    if(page==='maths'&&r.id==='play'&&location.hash.split('/')[2]) document.querySelector('.ir-over')?.focus({preventScroll:true});
    else if(!(page==='maths'&&r.id==='play')) document.querySelector('#main').focus({preventScroll:true});
  }
  if(page==='maths'&&r.id&&r.id!=='play') document.getElementById(`maths-${r.id}`)?.scrollIntoView({behavior:'instant'});
  else if(page==='maths'&&!r.id&&wasPlay&&Interiors.lastGame){
    const topic = document.getElementById(`maths-${Interiors.lastGame}`);
    topic?.scrollIntoView({behavior:'instant'});
    topic?.querySelector('.maths-enter')?.focus({preventScroll:true});
  }
}

function wirePage(){
  document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    const f = btn.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(x=>{
      const on = x===btn;
      x.classList.toggle('active',on);
      x.setAttribute('aria-pressed',String(on));
    });
    const list = articles.filter(a=>f==='ALL'||a.tag===f);
    document.querySelector('#article-list').innerHTML = list.map(Field.card).join('');
    const count = document.querySelector('#research-count');
    if(count) count.textContent = `${list.length} research note${list.length===1?'':'s'}`;
  }));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.toc a[href^="#section-"]').forEach(link=>link.addEventListener('click',e=>{
    e.preventDefault();
    document.querySelector(link.getAttribute('href'))?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
  }));
}

const navEl = document.querySelector('#nav');
const menuEl = document.querySelector('#mobile-menu');
const menuToggle = document.querySelector('#menu-toggle');
navEl.innerHTML = nav.map(n=>`<a class="nav-link" data-page="${n[0]}" href="#${n[0]}">${n[1]}</a>`).join('');
menuEl.innerHTML = nav.map(n=>`<a class="nav-link" data-page="${n[0]}" href="#${n[0]}">${n[1]}</a>`).join('');

function closeMenu(returnFocus=false){
  if(menuEl.hidden) return;
  menuEl.hidden = true;
  menuToggle.setAttribute('aria-expanded','false');
  menuToggle.setAttribute('aria-label','Open menu');
  if(returnFocus) menuToggle.focus();
}
menuToggle.addEventListener('click',()=>{
  const open = menuEl.hidden;
  menuEl.hidden = !open;
  menuToggle.setAttribute('aria-expanded',String(open));
  menuToggle.setAttribute('aria-label',open?'Close menu':'Open menu');
});
menuEl.addEventListener('click',e=>{ if(e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!menuEl.hidden) closeMenu(true); });
document.addEventListener('pointerdown',e=>{ if(!menuEl.hidden&&!e.target.closest('.topbar')) closeMenu(); });
addEventListener('resize',()=>{ if(innerWidth>1050) closeMenu(); });

document.querySelector('.skip-link').addEventListener('click',e=>{
  e.preventDefault();
  const main = document.querySelector('#main');
  main.focus({preventScroll:true});
  main.scrollIntoView({behavior:'auto'});
});

addEventListener('hashchange',()=>render());
addEventListener('scroll',()=>{
  const a = articles.find(x=>location.hash===`#article/${x.id}`);
  if(a){
    const max = document.documentElement.scrollHeight-innerHeight;
    document.querySelector('#nav-sweep').style.width = `${max?Math.min(100,scrollY/max*100):0}%`;
    let active = 0;
    a.sections.forEach((_,i)=>{
      const el = document.querySelector(`#section-${i}`);
      if(el&&el.getBoundingClientRect().top<140) active = i;
    });
    document.querySelectorAll('.toc a').forEach((x,i)=>x.classList.toggle('active',i===active));
  }
},{passive:true});

const dialog = document.querySelector('#search-dialog');
const input = document.querySelector('#search-input');
const results = document.querySelector('#search-results');
function search(){
  const q = input.value.trim().toLowerCase();
  const items = [
    {kind:'LAB',label:'Mindcuber experiment',href:'#lab/mindcuber',text:'mindcuber cube scramble robot experiment lab'},
    {kind:'LAB',label:'Quantisation playground',href:'#lab/quantization',text:'quantization quantisation precision weights memory nvfp4 int4 lab'},
    ...articles.map(a=>({kind:'RESEARCH',label:a.title,href:`#article/${a.id}`,text:a.title+' '+a.tag+' '+a.dek})),
    {kind:'PAGE',label:'The Maths of AI',href:'#maths',text:'maths mathematics linear algebra matrix gradient descent attention softmax rope rotary torus dimensions superposition ablation'},
    ...Maths.topics.map(t=>({kind:'MATHS',label:t.short,href:`#maths/${t.id}`,text:t.short+' '+t.tag+' '+t.title})),
    ...Interiors.games.map(g=>({kind:'ART',label:`${g.maths} · ${g.title}`,href:'#maths/play/'+g.id,text:g.title+' '+g.maths+' '+g.caption+' '+g.concept})),
    {kind:'PAGE',label:'Research index',href:'#research',text:'research index articles'},
    {kind:'PAGE',label:'Models and experiments',href:'#models',text:'models console registry experiments'},
    {kind:'PAGE',label:'About',href:'#about',text:'about joe'}
  ].filter(x=>!q||x.text.toLowerCase().includes(q));
  results.innerHTML = items.length
    ? items.map(x=>`<a class="search-result" href="${x.href}"><span>${esc(x.label)}</span><small>${x.kind}</small></a>`).join('')
    : '<div class="empty-state">No matches. Try a project name or a topic such as attention or quantisation.</div>';
  results.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>dialog.close()));
}
function openSearch(){
  if(!dialog.open) dialog.showModal();
  input.value = '';
  search();
  input.focus();
}
document.querySelector('#search-open').addEventListener('click',openSearch);
input.addEventListener('input',search);
input.addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();results.querySelector('a')?.click();}
  if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('a')?.focus();}
});
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}
  if(e.key==='Escape'&&dialog.open)dialog.close();
});
render(true);
