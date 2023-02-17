import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';
import {
  IFCWALL,
  IFCCURTAINWALL,
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCFURNISHINGELEMENT,
  IFCDOOR,
  IFCWINDOW,
  IFCPLATE,
  IFCMEMBER
} from 'web-ifc'
import { LineBasicMaterial } from 'three';
import { MeshBasicMaterial } from 'three';
import Drawing from "dxf-writer";

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

loadIfc();

let properties;

async function loadIfc() {
	await viewer.GLTF.loadModel('./result/curtainwalls_Nivel 1.glb');
  await viewer.GLTF.loadModel('./result/slabs_Nivel 1.glb');
  await viewer.GLTF.loadModel('./result/slabs_Nivel 2.glb');
  await viewer.GLTF.loadModel('./result/doors_Nivel 1.glb');
  await viewer.GLTF.loadModel('./result/windows_Nivel 1.glb');
  await viewer.GLTF.loadModel('./result/walls_Nivel 1.glb');

  const rawProperties = await fetch('./result/properties.json');
  properties = await rawProperties.json();

  // Get Spatial tree
  const tree = await constructSpatialTree();
  console.log(tree);

}

// Get properties of selected item
window.ondblclick = async () => {
	const result = await viewer.IFC.selector.pickIfcItem(true);
	const foundProperties = properties[result.id];
	getPropertySets(foundProperties);
	console.log(foundProperties);
};
window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();

// Utils functions
function getFirstItemOfType(type) {
	return Object.values(properties).find(item => item.type === type);
}

function getAllItemsOfType(type) {
	return Object.values(properties).filter(item => item.type === type);
}

// Get spatial tree
async function constructSpatialTree() {
	const ifcProject = getFirstItemOfType('IFCPROJECT');

	const ifcProjectNode = {
		expressID: ifcProject.expressID,
		type: 'IFCPROJECT',
		children: [],
	};

	const relContained = getAllItemsOfType('IFCRELAGGREGATES');
	const relSpatial = getAllItemsOfType('IFCRELCONTAINEDINSPATIALSTRUCTURE');

	await constructSpatialTreeNode(
		ifcProjectNode,
		relContained,
		relSpatial,
	);

	return ifcProjectNode;

}

// Recursively constructs the spatial tree
async function constructSpatialTreeNode(
	item,
	contains,
	spatials,
) {
	const spatialRels = spatials.filter(
		rel => rel.RelatingStructure === item.expressID,
	);
	const containsRels = contains.filter(
		rel => rel.RelatingObject === item.expressID,
	);

	const spatialRelsIDs = [];
	spatialRels.forEach(rel => spatialRelsIDs.push(...rel.RelatedElements));

	const containsRelsIDs = [];
	containsRels.forEach(rel => containsRelsIDs.push(...rel.RelatedObjects));

	const childrenIDs = [...spatialRelsIDs, ...containsRelsIDs];

	const children = [];
	for (let i = 0; i < childrenIDs.length; i++) {
		const childID = childrenIDs[i];
		const props = properties[childID];
		const child = {
			expressID: props.expressID,
			type: props.type,
			children: [],
		};

		await constructSpatialTreeNode(child, contains, spatials);
		children.push(child);
	}

	item.children = children;
}

// Gets the property sets

function getPropertySets(props) {
	const id = props.expressID;
	const propertyValues = Object.values(properties);
	const allPsetsRels = propertyValues.filter(item => item.type === 'IFCRELDEFINESBYPROPERTIES');
	const relatedPsetsRels = allPsetsRels.filter(item => item.RelatedObjects.includes(id));
	const psets = relatedPsetsRels.map(item => properties[item.RelatingPropertyDefinition]);
	for(let pset of psets) {
		pset.HasProperty = pset.HasProperties.map(id => properties[id]);
	}
	props.psets = psets;
}
