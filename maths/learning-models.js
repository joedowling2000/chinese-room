/* Calculations shared by the teaching panels and their canvas scenes.
   These are synthetic examples, not measurements of a trained language model. */
const LearningModels = (() => {
  const tolerance = 1e-12;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const vector = v => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite);
  const pair = v => `(${v[0].toFixed(3)}, ${v[1].toFixed(3)})`;

  function linearMap(matrix, input) {
    if (!Array.isArray(matrix) || matrix.length !== 4 || !matrix.every(Number.isFinite) || !vector(input)) {
      throw new TypeError('Linear maps need four finite matrix entries and a two-coordinate input.');
    }
    const [a,b,c,d] = matrix, [x,y] = input;
    const columns = [[a*x,c*x],[b*y,d*y]];
    return {columns, output: columns[0].map((v,i) => v + columns[1][i]), determinant: a*d-b*c};
  }

  function linearFeedback(before, after) {
    const a = linearMap(before.matrix,before.input), b = linearMap(after.matrix,after.input);
    const matrixChanged = before.matrix.some((v,i) => v !== after.matrix[i]);
    const inputChanged = before.input.some((v,i) => v !== after.input[i]);
    return {
      summary: matrixChanged ? 'The matrix changed: the same new rule now acts on every input.' :
        inputChanged ? 'The input changed; the matrix stayed fixed.' : 'No mathematical values changed.',
      explanation: 'Multiply each matrix column by its input coordinate, then add the two contributions. ' +
        (b.determinant === 0 ? 'This matrix loses information: distinct inputs can share an output.' :
        'This matrix has nonzero determinant, so distinct inputs have distinct outputs.') +
        ' These are manual edits to a synthetic example, not optimiser updates.',
      rows: [['Input',pair(before.input),pair(after.input)],
        ['Matrix rows',pair(before.matrix.slice(0,2))+'; '+pair(before.matrix.slice(2)),pair(after.matrix.slice(0,2))+'; '+pair(after.matrix.slice(2))],
        ['Output',pair(a.output),pair(b.output)],['Determinant',a.determinant.toFixed(3),b.determinant.toFixed(3)]],
      calculation: [['x × first column',pair(b.columns[0])],['y × second column',pair(b.columns[1])],['Sum / output',pair(b.output)]]
    };
  }

  function attention(query, temperature, keys) {
    if (!vector(query) || !Number.isFinite(temperature) || temperature <= 0 ||
        !Array.isArray(keys) || !keys.length || !keys.every(vector)) {
      throw new TypeError('Attention needs a finite query, positive temperature and two-coordinate keys.');
    }
    const scores = keys.map(k => query[0] * k[0] + query[1] * k[1]);
    const scaled = scores.map(score => score / temperature);
    const peak = Math.max(...scaled);
    const exponentials = scaled.map(score => Math.exp(score - peak));
    const total = exponentials.reduce((a, b) => a + b, 0);
    const weights = exponentials.map(value => value / total);
    // This first teaching prototype intentionally retains values = keys.
    const contributions = keys.map((k, i) => k.map(value => value * weights[i]));
    const output = contributions.reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
    const entropy = -weights.reduce((sum, w) => sum + (w > 0 ? w * Math.log2(w) : 0), 0);
    const top = weights.indexOf(Math.max(...weights));
    return {query: [...query], temperature, scores, scaled, weights, contributions, output, entropy, top};
  }

  function attentionFeedback(before, after, names, action) {
    const changed = after.weights.some((w, i) => Math.abs(w - before.weights[i]) > tolerance);
    const concentration = after.entropy - before.entropy;
    const distribution = !changed ? 'The attention weights stayed the same.' :
      concentration < -tolerance ? 'The attention weights became more concentrated.' :
      concentration > tolerance ? 'The attention weights became more spread out.' :
      'The attention weights changed, with similar overall concentration.';
    const reason = action === 'temperature'
      ? 'The raw query–key dot products stayed fixed. Temperature sets their scale before softmax.'
      : 'The query changed. Its dot products with the fixed keys determine the attention weights.';
    const unchanged = pair(before.query) === pair(after.query) && !changed &&
      before.temperature === after.temperature;
    return {
      summary: unchanged ? 'No calculated change at the displayed precision.' : distribution,
      explanation: `${reason} Each weight multiplies a value vector; those contributions add to the output. Values equal keys in this example. No learned parameters were updated.`,
      rows: [
        ['Query', pair(before.query), pair(after.query)],
        ['Score temperature', before.temperature.toFixed(2), after.temperature.toFixed(2)],
        ['Strongest key', names[before.top], names[after.top]],
        ['Largest weight', `${(100 * before.weights[before.top]).toFixed(1)}%`, `${(100 * after.weights[after.top]).toFixed(1)}%`],
        ['Output vector', pair(before.output), pair(after.output)]
      ]
    };
  }

  // Same surface and derivatives as the original gradient-descent scene.
  const loss = (x, z) => .14 * (x * x + z * z) +
    .32 * Math.sin(1.6 * x + .4) * Math.cos(1.3 * z - .3) + .08 * x;
  const gradient = (x, z) => [
    .28 * x + .512 * Math.cos(1.6 * x + .4) * Math.cos(1.3 * z - .3) + .08,
    .28 * z - .416 * Math.sin(1.6 * x + .4) * Math.sin(1.3 * z - .3)
  ];
  const domain = 2.6;

  function descentStep(state) {
    const {point, velocity, lr, mu, steps} = state;
    if (!vector(point) || !vector(velocity) || ![lr, mu].every(Number.isFinite) ||
        lr <= 0 || mu < 0 || mu >= 1 || !Number.isInteger(steps) || steps < 0) {
      throw new TypeError('Invalid gradient-descent state.');
    }
    const grad = gradient(...point);
    const momentum = velocity.map(v => mu * v);
    const downhill = grad.map(g => -lr * g);
    const update = momentum.map((v, i) => v + downhill[i]);
    const candidate = point.map((v, i) => v + update[i]);
    const outside = candidate.some(v => Math.abs(v) > domain);
    const nextPoint = candidate.map(v => clamp(v, -domain, domain));
    const nextGradient = gradient(...nextPoint);
    const nextSteps = steps + 1;
    const status = outside ? 'diverged' :
      Math.hypot(...nextGradient) < 2e-3 && Math.hypot(...update) < 2e-3 ? 'settled' :
      nextSteps >= 500 ? 'stopped' : 'running';
    const beforeLoss = loss(...point), afterLoss = loss(...nextPoint);
    return {
      next: {point: nextPoint, velocity: update, lr, mu, steps: nextSteps, status},
      gradient: grad, momentum, downhill, update, candidate, outside,
      beforeLoss, afterLoss, deltaLoss: afterLoss - beforeLoss
    };
  }

  function descentFeedback(before, result, preview = false) {
    const {next, deltaLoss, outside} = result;
    const direction = Math.abs(deltaLoss) <= tolerance ? 'stayed effectively unchanged' :
      deltaLoss < 0 ? 'decreased' : 'increased';
    return {
      summary: outside
        ? `${preview ? 'The proposed' : 'The'} update leaves the plotted domain. ${preview ? 'Applying it will stop' : 'The run stopped'} at the boundary.`
        : preview ? `This proposed update would change the loss by ${deltaLoss.toFixed(4)}. No parameters have changed yet.`
        : `The loss ${direction} by ${Math.abs(deltaLoss).toFixed(4)} after this parameter update.`,
      explanation: outside
        ? 'The candidate point is outside the scene. The displayed endpoint is clipped to its boundary, so its loss is not the loss at the full proposed update. Try a smaller learning rate.'
        : 'Update = momentum × previous update − learning rate × gradient. A finite update can increase loss. These are two parameters on a synthetic surface, not a trained language model.',
      rows: [
        ['Parameters', pair(before.point), pair(next.point)],
        ['Raw surface loss', result.beforeLoss.toFixed(4), result.afterLoss.toFixed(4)],
        ['Previous / next update', pair(before.velocity), pair(next.velocity)],
        ['Step', String(before.steps), String(next.steps)]
      ],
      calculation: [
        ['Gradient', pair(result.gradient)],
        ['Momentum contribution', pair(result.momentum)],
        ['Negative gradient × rate', pair(result.downhill)],
        ['Proposed update', pair(result.update)],
        ['Proposed parameters', pair(result.candidate)]
      ]
    };
  }

  return {linearMap, linearFeedback, attention, attentionFeedback, loss, gradient, domain, descentStep, descentFeedback, pair};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LearningModels;
