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
}

window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();


window.ondblclick = async () => {
  const found = await viewer.IFC.selector.pickIfcItem();
  const result = await viewer.IFC.loader.ifcManager.getItemProperties(found.modelID, found.id);
  console.log(result);
}