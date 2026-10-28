# AI, a Lego Robot and a Rubik's Cube!

**A project to build and train a neural network to solve a Rubik's cube using a lego robot.**

Most people can learn to solve a Rubik's cube in a couple of hours. Doing so involves recognising a few key patterns, learning 6 or 7 simple algorithms and of course, practice. Taken to extremes, the global speedcube circuit includes numerous youngsters who can solve a scrambled cube in under 4 seconds, with the current record holder, 9 year Teodor Zajder from Poland, clocking 2.76 seconds at an event in February 2026.

It might be surprising then, to discover that a Rubik's cube falls into a category of problems which is straightforward for humans, but incredibly difficult for a computer that has not been pre-programmed with the required algorithms.

Why? Because a scrambled Rubik's cube has 4.3 x 10^19 (43 quintillion) possible states. That is an unfathomably large number; it is more than the number of seconds that have passed since the big bang, and more than the number of grains of sand on the earth. If you took a standard sized 3x3 cube in every unique state, you could completely cover the earth 270 times over.

The focus of this project and article is the neural network, training and most importantly, learning (both machine and personal!), so lets get one of the coolest elements of the project out of the way first.

## The Lego Robot

The robot in the photo is the incredible creation of David Gilday, an engineer at ARM and robot enthusiast. The build is based on Lego Set 51515 – Mindstormers Robot Inventor, a set which I fortunately bought for my son Henry a few years ago. After disassembling the Spike guardian build that was on patrol on Henry's desk, the Mindcuber robot took about 2 hours to put together.

The base controller runs micropython and the mindcuber project includes a neat programme which scans the cube using a colour recognition sensor, computes the required moves to solve, then executes by rotating the cube in a basket, flipping as needed so that the required face can be rotated. The only notable limitation is that the robot can only rotate a single face (the face in the basket).

The instructions provided with the Mindcuber build are good, so the robot was built, calibrated and performing its tricks to the amazement of my family in under 3 hours.

If you are interested in building mindcuber, you can check out the instructions here.

## The Neural Network

With the baseline robot built and tested I could move onto the project itself. In previous projects I have used various models in different ways, but this was my first attempt at creating one from scratch. The intention, apart from being very cool in its own right, is that it is the next logical stepping stone on the learning path to building my own LLM on the DGX spark.
