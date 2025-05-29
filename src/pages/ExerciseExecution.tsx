const stored = localStorage.getItem("currentExercise");
console.log('Lido do localStorage:', stored);
const exercise = stored ? JSON.parse(stored) : null; 