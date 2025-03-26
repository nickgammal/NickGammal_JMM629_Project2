
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";



// read csv data
let counts = await d3.csv("counts.csv", d3.autoType);
let edges = await d3.csv("edges.csv", d3.autoType);

// create graph as dictionary
let data = {"nodes":[], "links":[]};

// populate graph with nodes and edges
for (let i in counts) {
    let sp = counts[i];
    data.nodes.push({"id":sp["class"], "group":sp["trophic"], "count":sp["n"]});
}

for (let i in edges) {
    let eats = edges[i];
    data.links.push({"source":eats["source"], "target":eats["target"], "value":3});
}



// Specify the dimensions of the chart.
const width = 928;
const height = 600;

// Specify the color scale.
const color = d3.scaleOrdinal([0, 1, 2, 3], ["#50c878", "#fa8072", "#ff2400", "#7c0a02"]);

// The force simulation mutates links and nodes, so create a copy
// so that re-evaluating this cell produces the same result.
const links = data.links.map(d => ({...d}));
const nodes = data.nodes.map(d => ({...d}));

// Create a simulation with several forces.
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-150))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

// Create the SVG container.
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

// Add a line for each link, and a circle for each node.
const link = svg.append("g")
    .attr("stroke", "#888")
    .attr("stroke-opacity", 0.6)
    .selectAll()
    .data(links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value));

const node = svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(nodes)
    .join("circle")
    .on("contextmenu", event => {

        //stop showing browser context menu
        event.preventDefault();

        // delete node data if right-click
        let nodedata = event.target.__data__;
        let nodeindex = nodes.indexOf(nodedata);
        if (nodeindex >= 0) {
            nodes.splice(nodeindex, 1);
        }
        
        // delete link data if right-click
        let nodeid = nodedata.id;

        links.forEach(link => {
            if(link.source.id == nodeid) {
                let linkindex = links.indexOf(link);
                if (linkindex >= 0) {
                    links.splice(linkindex, 1);
                }
            }
            if(link.target.id == nodeid) {
                let linkindex = links.indexOf(link);
                if (linkindex >= 0) {
                    links.splice(linkindex, 1);
                }
            }
        });

        simulation.restart();

        // remove the physical node and link elements
        svg.removeChild(d.target);
        console.log(d.target);

/*
            I can remove the nodes and links from the data dictionary, but I can't figure 
            out how to get the simulation to restart with the new data. So as of now, the 
            nodes and edges of the removed data remain stuck in place on the screen.
*/


    update({nodes, links})





     })
    .attr("r", d => Math.log(d.count))
    .attr("fill", d => color(d.group));

node.append("title")
    .text(d => d.id);

// Add a drag behavior.
node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

// Set the position attributes of links and nodes each time the simulation ticks.
function ticked() {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
}

// Reheat the simulation when drag starts, and fix the subject position.
function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
}

// Update the subject (dragged node) position during drag.
function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
}

// Restore the target alpha so the simulation cools after dragging ends.
// Unfix the subject position now that it’s no longer being dragged.
function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
}

// When this cell is re-run, stop the previous simulation. (This doesn’t
// really matter since the target alpha is zero and the simulation will
// stop naturally, but it’s a good practice.)
//invalidation.then(() => simulation.stop());

// add svg to html in div called "chart"
chart.append(svg.node());

