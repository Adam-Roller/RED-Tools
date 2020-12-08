// Classes
class Node {
    constructor(depth) {
        this.depth = depth;
        this.children = [];
        this.text = "";
    }
}

// Constants
const svgNamespace  = "http://www.w3.org/2000/svg";
const svgId         = "#nodeChart";
const difficultyId  = "#difficulty";
const fillColor     = "#FFFFFF";
const strokeColor   = "#FF0000";
const selectColor   = "#00FF00";
const strokeWidth   = 2;
const rectWidth     = 200;
const rectHeight    = 50;
const textHeight    = 10;
const vPadding      = 50;
const hPadding      = 100;
const nodeClass     = "floorRect";
const rectClass     = "boundingRect";

// Globals
let nodeCount       = 0;
let rootNode        = null;
let maxDepth        = 0;
let totalBranches   = 0;
let selectedNode    = null;

// Floor Rolling Tables
let rerollNums = new Set();
rerollNums.add(6);
rerollNums.add(7);
rerollNums.add(8);
rerollNums.add(9);
const lobbyFloor = [
    "File DV6",
    "Password DV6",
    "Password DV8",
    "Skunk",
    "Wisp",
    "Killer"
]
const basicFloor = [
    "Hellhound",
    "Sabertooth",
    "Raven x2",
    "Hellhound",
    "Wisp",
    "Raven",
    "Password DV6",
    "File DV6",
    "Control Node DV6",
    "Password DV6",
    "Skunk",
    "Asp",
    "Scorpion",
    "Killer, Skunk",
    "Wisp x3",
    "Liche"
]
const standardFloor = [
    "Hellhound x2",
    "Hellhound, Killer",
    "Skunk x2",
    "Sabertooth",
    "Scorpion",
    "Hellhound",
    "Password DV8",
    "File DV8",
    "Control Node DV8",
    "Password DV8",
    "Asp",
    "Killer",
    "Liche",
    "Asp",
    "Raven x3",
    "Liche, Raven"
]
const uncommonFloor = [
    "Kraken",
    "Hellhound, Scorpion",
    "Hellhound, Killer",
    "Raven x2",
    "Sabertooth",
    "Hellhound",
    "Password DV10",
    "File DV10",
    "Control Node DV10",
    "Password DV10",
    "Killer",
    "Liche",
    "Dragon",
    "Asp, Raven",
    "Dragon, Wisp",
    "Giant"
]
const advancedFloor = [
    "Hellhound x3",
    "Asp x2",
    "Hellhound, Liche",
    "Wisp x3",
    "Hellhound, Sabertooth",
    "Kraken",
    "Password DV12",
    "File DV12",
    "Control Node DV12",
    "Password DV12",
    "Giant",
    "Dragon",
    "Killer, Scorpion",
    "Kraken",
    "Raven, Wisp, Hellhound",
    "Dragon x2"
]

function generateTree() {
    console.log("test");
    // # of Floors is 3d6
    let floors = Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6);
    // Can't branch until after the second floor, one branch needs to be longest
    let maxBranches = Math.ceil(floors / 2) - 2;

    // Number of branches is how many 7 or aboves are rolled in a row
    totalBranches = 0;
    while (Math.ceil(Math.random() * 10) >= 7 && totalBranches < maxBranches) {
        console.log("branch");
        totalBranches++;
    }
    /*
     * BRANCH MATH!
     * A branch creates two nodes by definition.
     * One path has to be the longest so the final node can't be one of the two nodes of a branch.
     * So the final branch has to occur no later than the 'totalNodes - 3' node.
     * Any branch before the final branch also creates two nodes, and can't create one of the last 3 nodes.
     * So branches generally must occur by 'totalNodes - (branchesLeft * 2) - 1'
     */

    // Start with the root Node
    rootNode = new Node(1);
    let nodeQueue = [];
    nodeQueue.push(rootNode);
    nodeCount = 0;

    // Track the max depth to ensure a single longest branch
    maxDepth = 1;
    // Track how many branches have been created so far
    let currentBranches = 0;
    // Track previous rolls
    let prevRolls = new Set();

    // Set difficulty table
    const difficulty = document.querySelector(difficultyId);
    const selected = difficulty.options[difficulty.selectedIndex].value;
    let floorTable = null;
    if (selected == "basic") {
        floorTable = basicFloor;
    } else if (selected == "standard") {
        floorTable = standardFloor;
    } else if (selected == "uncommon") {
        floorTable = uncommonFloor;
    } else {
        floorTable = advancedFloor;
    }

    console.log("Start of loop, " + floors + " floors, " + totalBranches + " branches");
    while (nodeQueue.length > 0) {
        // Take from the front of the queue
        let iNode = nodeQueue.shift();
        nodeCount++;

        // Roll floor info
        if (nodeCount < 3) {
            iNode.text = lobbyFloor[(Math.floor(Math.random() * 6))];
        } else {
            let floorRoll = 0;
            do {
                floorRoll = Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6) - 3;
            } while (rerollNums.has(floorRoll) && prevRolls.has(floorRoll));
            prevRolls.add(floorRoll);
            iNode.text = floorTable[floorRoll];
        }

        console.log("Node " + nodeCount + " depth " + iNode.depth);

        // Don't add more floors than you rolled
        if (floors - nodeCount - nodeQueue.length > 0) {
            // Don't create children if there's one floor left and you won't create the longest branch.
            if (floors - nodeCount - nodeQueue.length == 1 && iNode.depth < maxDepth) {
                continue;
            }

            // If you're not the last leaf, you don't have to have a child.
            if (nodeQueue.length > 0 && Math.ceil(Math.random() * 2) == 1) {
                continue;
            }

            let doWeBranch = false;

            // Can we branch?
            if (nodeCount != 1 && currentBranches < totalBranches) {
                // Determine what floor you must make the next branch by (see branch math comment above loop)
                let requiredBranchNode = floors - ((totalBranches - currentBranches) * 2) - 1;
                // Branch if required, otherwise flip a coin to see if the branch happens.
                if (requiredBranchNode == nodeCount) {
                    doWeBranch = true;   
                    currentBranches++
                } else if (Math.ceil(Math.random() * 2) == 1) {
                    doWeBranch = true;
                    currentBranches++;
                } else if (requiredBranchNode - nodeCount == 1 && nodeQueue.length > 0) {
                    /* If a branch is still needed, you don't branch, AND you have a sibling then you
                     * shouldn't create a child. 
                     *
                     * This is to prevent equal-depth branches (if your sibling creates
                     * the final branch) and not having two nodes to branch into (if your sibling has to
                     * branch but isn't the last brancher).
                     *
                     * This makes more sense when you realise if a non-final branch doesn't happen until the
                     * last possible node, one of that nodes children will be the last possible node for the
                     * next branch to start from.
                     */
                    continue;
                }
            }

            // Create the first child
            let child1 = new Node(iNode.depth + 1);
            iNode.children.push(child1);
            nodeQueue.push(child1);

            if (iNode.depth + 1 > maxDepth) {
                maxDepth = iNode.depth + 1;
            }

            // Create the second child if branching
            if (doWeBranch == true) {
                let child2 = new Node (iNode.depth + 1);
                nodeQueue.push(child2);
                /*
                 * Flip a coin to see if the second child is the right or left child to prevent branching from
                 * being skewed in one direction.
                 */
                if (Math.ceil(Math.random() * 2) == 1) {
                    iNode.children.push(child2);
                } else {
                    iNode.children.unshift(child2);
                }
            }
        }
    }

    displayTree();
}

function displayTree() {
    clearTree();

    // SVG Element
    const svg = document.querySelector(svgId);
    let viewboxWidth = ((totalBranches * rectWidth) + (totalBranches * hPadding) + hPadding) * 2;
    let viewboxHeight = (maxDepth * rectHeight) + (maxDepth * vPadding) + vPadding;
    svg.setAttribute('viewBox', "0 0 " + viewboxWidth + " " + viewboxHeight);
    //svg.setAttribute('preserveAspectRatio', "xMinYMin meet");

    displayNode(rootNode, 0, viewboxWidth, vPadding);
}

function displayNode(node, xMin, xMax, y) {
    // Group for the node
    const group = document.createElementNS(svgNamespace, 'g');
    group.setAttribute('class', nodeClass);

    // Rectangle
    const rect = document.createElementNS(svgNamespace, 'rect');
    rect.setAttribute('width', rectWidth);
    rect.setAttribute('height', rectHeight);
    let x = ((xMin + xMax) / 2);
    rect.setAttribute('x', x - (rectWidth / 2));
    rect.setAttribute('y', y);
    rect.setAttribute('strokeWidth', strokeWidth);
    rect.setAttribute('stroke', strokeColor);
    rect.setAttribute('fill', fillColor);

    // Text
    const text = document.createElementNS(svgNamespace, 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y + (rectHeight / 2));
    //text.setAttribute('font-family', "Teko");
    text.setAttribute('font-size', "30px");
    text.setAttribute('dominant-baseline', "middle");
    text.setAttribute('text-anchor', "middle");
    text.textContent = node.text;

    // Add to the DOM
    const svg = document.querySelector(svgId);
    svg.appendChild(group);
    group.appendChild(rect);
    group.appendChild(text);

    group.addEventListener("click", selectNode);

    if (node.children.length == 1) {
        // Create connecting line
        const line = document.createElementNS(svgNamespace, 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', y + rectHeight);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y + rectHeight + vPadding);
        line.setAttribute('stroke', "#000000");
        line.setAttribute('stroke-width', "4");
        group.appendChild(line);

        // Display child
        displayNode(node.children[0], xMin, xMax, y + rectHeight + vPadding); 

    } else if (node.children.length == 2) {
        const line1 = document.createElementNS(svgNamespace, 'line');
        line1.setAttribute('x1', x);
        line1.setAttribute('y1', y + rectHeight);
        line1.setAttribute('x2', (xMin + x) / 2);
        line1.setAttribute('y2', y + rectHeight + vPadding);
        line1.setAttribute('stroke', "#000000");
        line1.setAttribute('stroke-width', "4");
        group.appendChild(line1);

        const line2 = document.createElementNS(svgNamespace, 'line');
        line2.setAttribute('x1', x);
        line2.setAttribute('y1', y + rectHeight);
        line2.setAttribute('x2', (xMax + x) / 2);
        line2.setAttribute('y2', y + rectHeight + vPadding);
        line2.setAttribute('stroke', "#000000");
        line2.setAttribute('stroke-width', "4");
        group.appendChild(line2);

        displayNode(node.children[0], xMin, x, y + rectHeight + vPadding); 
        displayNode(node.children[1], x, xMax, y + rectHeight + vPadding);
    }
}

function clearTree() {
    let groups = document.getElementsByClassName(nodeClass);
    for (let i = groups.length - 1; i >= 0; i--) {
        groups.item(i).remove();
    }
}

function selectNode(event) {
    // Clear highlight from previous selection
    if (selectedNode != null) {
        selectedNode.querySelector('rect').setAttribute('stroke', strokeColor);
    }

    // The event target is likely not the group, select the group.
    const target = event.target;
    if (target.nodeName == "g") {
        selectedNode = target;
    } else {
        selectedNode = target.parentNode;
    }

    // Highlight the selected rectangle
    const rect = selectedNode.querySelector('rect');
    rect.setAttribute('stroke', selectColor);

    // Add the text to the editing area
    const textArea = document.querySelector("#selectText");
    const applyButton = document.querySelector("#applySelect");
    const text = selectedNode.querySelector('text');

    textArea.value = text.textContent;
    textArea.disabled = false;
    applyButton.disabled = false;
}

function applySelectionChanges(event) {
    const textArea = document.querySelector("#selectText");
    const text = selectedNode.querySelector('text');

    text.textContent = textArea.value;
}

// Add EventListeners
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector('#GenerateTree').addEventListener("click", generateTree);
    document.querySelector('#applySelect').addEventListener("click", applySelectionChanges);
});
