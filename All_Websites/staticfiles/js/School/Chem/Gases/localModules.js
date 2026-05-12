export let defaultColors = [
    "#4747FF",
    "#8C0000",
    "#008000",
    "#66CCAB",
    "#00BFFF",
    "#FF4500",
    "#4A0082",
    "#008080",
    "#F0E58C",
    "#A1522E",
    "#B0C4DE",
    "#F08080",
    "#87CFFA",
    "#2E8C57",
    "#473D8C",
];
export function removeColor(colorList, numberUsed = 1) {
    colorList.shift();
    for (let i = 1; i < numberUsed; i++) {
        colorList.shift();
        if (colorList.length === 0) {
            colorList.push(...defaultColors);
        }
    }
}
// export function breadthFirstSearch(start) {
//   const queue = [start];
//   const visited = new Set([start]);
//   while (queue.length > 0) {
//     const node = queue.shift();
//     console.log(node);
//     for (const neighbor of node.neighbors) {
//       if (!visited.has(neighbor)) {
//         visited.add(neighbor);
//         queue.push(neighbor);
//       }
//     }
//   }
// }
// document.addEventListener('DOMContentLoaded', () => {
//   export const equationsContainer = document.getElementById('equations') as HTMLDivElement;
// });
//# sourceMappingURL=localModules.js.map