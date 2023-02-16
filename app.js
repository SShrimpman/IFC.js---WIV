import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';
import {
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCFURNISHINGELEMENT,
  IFCDOOR,
  IFCWINDOW,
  IFCPLATE,
  IFCMEMBER
} from 'web-ifc'

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

const scene = viewer.context.getScene();

loadIfc('./01.ifc');
let model;

async function loadIfc(url) {
		// Load the model
    model = await viewer.IFC.loadIfcUrl(url);
    model.removeFromParent();
    togglePickable(model, false);

		// Add dropped shadow and post-processing efect
    await viewer.shadowDropper.renderShadow(model.modelID);
    viewer.context.renderer.postProduction.active = true;
    await setupAllCategories();

    // // Add Spatial Structure Menu to the project
    // const project = await viewer.IFC.getSpatialStructure(model.modelID);
    // console.log(project);
    // createTreeMenu(project);
}

window.onmousemove = () => {
  viewer.IFC.selector.prePickIfcItem();
}

window.ondblclick = () => {
  const result = viewer.context.castRayIfc();
  console.log(result);
  if(result === null) return;

  const index = result.faceIndex;
  const subset = result.object;
  const id = viewer.IFC.loader.ifcManager.getExpressId(subset.geometry, index);
  viewer.IFC.loader.ifcManager.removeFromSubset(
    subset.modelID,
    [id],
    subset.userData.category
  );
  updatePostProduction();
}

const categories = {
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCFURNISHINGELEMENT,
  IFCDOOR,
  IFCWINDOW,
  IFCPLATE,
  IFCMEMBER
}

function getName(category){
  const names= Object.keys(categories);
  return names.find(name => categories[name] === category);
}

async function getAll(category){
  return viewer.IFC.loader.ifcManager.getAllItemsOfType(model.modelID, category);
}

const subsets = {};

async function setupAllCategories(){
  const allCategories = Object.values(categories);
  for(const category of allCategories){
    await setupCategory(category);
  }
}

async function setupCategory(category){
  const subset = await newSubsetOfType(category);
  subset.userData.category = category.toString();
  subsets[category] = subset;
  togglePickable(subset, true);
  setupCheckbox(category);
}

function setupCheckbox(category){
  const name = getName(category);
  const checkbox = document.getElementById(name);
  checkbox.addEventListener('change', () => {
    const subset = subsets[category];
    if(checkbox.checked) {
      scene.add(subset);
      togglePickable(subset, true);
    }
    else {
      subset.removeFromParent();
      togglePickable(subset, false);
    }

    updatePostProduction()

  });
}

function updatePostProduction(){
  viewer.context.renderer.postProduction.update();
}

async function newSubsetOfType(category){
  const ids = await getAll(category);
  return viewer.IFC.loader.ifcManager.createSubset({
    modelID: model.modelID,
    scene,
    ids,
    removePrevious: true,
    customID: category.toString()
  });
}

function togglePickable(mesh, isPickable){
  const pickableModels = viewer.context.items.pickableIfcModels;
  if(isPickable){
    pickableModels.push(mesh);
  } else {
    const index = pickableModels.indexOf(mesh);
    pickableModels.splice(index, 1);
  }
}

// // Spatial tree menu

// function createTreeMenu(ifcProject) {
//   const root = document.getElementById("tree-root");
//   removeAllChildren(root);
//   const ifcProjectNode = createNestedChild(root, ifcProject);
//   ifcProject.children.forEach(child => {
//       constructTreeMenuNode(ifcProjectNode, child);
//   })
// }

// function nodeToString(node) {
//   return `${node.type} - ${node.expressID}`
// }

// function constructTreeMenuNode(parent, node) {
//   const children = node.children;
//   if (children.length === 0) {
//       createSimpleChild(parent, node);
//       return;
//   }
//   const nodeElement = createNestedChild(parent, node);
//   children.forEach(child => {
//       constructTreeMenuNode(nodeElement, child);
//   })
// }

// function createNestedChild(parent, node) {
//   const content = nodeToString(node);
//   const root = document.createElement('li');
//   createTitle(root, content);
//   const childrenContainer = document.createElement('ul');
//   childrenContainer.classList.add("nested");
//   root.appendChild(childrenContainer);
//   parent.appendChild(root);
//   return childrenContainer;
// }

// function createTitle(parent, content) {
//   const title = document.createElement("span");
//   title.classList.add("caret");
//   title.onclick = () => {
//       title.parentElement.querySelector(".nested").classList.toggle("active");
//       title.classList.toggle("caret-down");
//   }
//   title.textContent = content;
//   parent.appendChild(title);
// }

// function createSimpleChild(parent, node) {
//   const content = nodeToString(node);
//   const childNode = document.createElement('li');
//   childNode.classList.add('leaf-node');
//   childNode.textContent = content;
//   parent.appendChild(childNode);

//   childNode.onmouseenter = () => {
//       viewer.IFC.selector.prepickIfcItemsByID(0, [node.expressID]);
//   }

//   childNode.onclick = async () => {
//       viewer.IFC.selector.pickIfcItemsByID(0, [node.expressID]);
//   }
// }

// function removeAllChildren(element) {
//   while (element.firstChild) {
//       element.removeChild(element.firstChild);
//   }
// }

// const toggler = document.getElementsByClassName('caret');
// let i;

// for(i = 0; i < toggler.length; i++) {
//   toggler[i].addEventListener('click', function() {
//     this.parentElement.querySelector('.nested').classList.toggle('active');
//     this.classList.toggle('caret-down');
//   });
// }

// window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();


// window.ondblclick = async () => {
//   const found = await viewer.IFC.selector.pickIfcItem();
//   const result = await viewer.IFC.loader.ifcManager.getItemProperties(found.modelID, found.id);
//   console.log(result);
// }