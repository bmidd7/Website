"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.breadthFirstSearch = breadthFirstSearch;
function breadthFirstSearch(start) {
    const queue = [start];
    const visited = new Set([start]);
    while (queue.length > 0) {
        const node = queue.shift();
        console.log(node);
        for (const neighbor of node.neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
}
// document.addEventListener('DOMContentLoaded', () => {
//   export const equationsContainer = document.getElementById('equations') as HTMLDivElement;
// });
//# sourceMappingURL=localModules.js.map