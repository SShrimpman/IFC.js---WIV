import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

loadIfc('./01.ifc');

async function loadIfc(url) {
		// Load the model
    const model = await viewer.IFC.loadIfcUrl(url);

		// Add dropped shadow and post-processing efect
    await viewer.shadowDropper.renderShadow(model.modelID);
    viewer.context.renderer.postProduction.active = true;


    const project = await viewer.IFC.getSpatialStructure(model.modelID);
    console.log(project);
    createTreeMenu(project);
}


// Spatial tree menu

function createTreeMenu(ifcProject) {
  const root = document.getElementById("tree-root");
  removeAllChildren(root);
  const ifcProjectNode = createNestedChild(root, ifcProject);
  ifcProject.children.forEach(child => {
      constructTreeMenuNode(ifcProjectNode, child);
  })
}

function nodeToString(node) {
  return `${node.type} - ${node.expressID}`
}

function constructTreeMenuNode(parent, node) {
  const children = node.children;
  if (children.length === 0) {
      createSimpleChild(parent, node);
      return;
  }
  const nodeElement = createNestedChild(parent, node);
  children.forEach(child => {
      constructTreeMenuNode(nodeElement, child);
  })
}

function createNestedChild(parent, node) {
  const content = nodeToString(node);
  const root = document.createElement('li');
  createTitle(root, content);
  const childrenContainer = document.createElement('ul');
  childrenContainer.classList.add("nested");
  root.appendChild(childrenContainer);
  parent.appendChild(root);
  return childrenContainer;
}

function createTitle(parent, content) {
  const title = document.createElement("span");
  title.classList.add("caret");
  title.onclick = () => {
      title.parentElement.querySelector(".nested").classList.toggle("active");
      title.classList.toggle("caret-down");
  }
  title.textContent = content;
  parent.appendChild(title);
}

function createSimpleChild(parent, node) {
  const content = nodeToString(node);
  const childNode = document.createElement('li');
  childNode.classList.add('leaf-node');
  childNode.textContent = content;
  parent.appendChild(childNode);

  childNode.onmouseenter = () => {
      viewer.IFC.selector.prepickIfcItemsByID(0, [node.expressID]);
  }

  childNode.onclick = async () => {
      viewer.IFC.selector.pickIfcItemsByID(0, [node.expressID]);
  }
}

function removeAllChildren(element) {
  while (element.firstChild) {
      element.removeChild(element.firstChild);
  }
}

const toggler = document.getElementsByClassName('caret');
let i;

for(i = 0; i < toggler.length; i++) {
  toggler[i].addEventListener('click', function() {
    this.parentElement.querySelector('.nested').classList.toggle('active');
    this.classList.toggle('caret-down');
  });
}

// window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();


// window.ondblclick = async () => {
//   const found = await viewer.IFC.selector.pickIfcItem();
//   const result = await viewer.IFC.loader.ifcManager.getItemProperties(found.modelID, found.id);
//   console.log(result);
// }