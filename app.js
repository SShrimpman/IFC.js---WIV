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
import { LineBasicMaterial } from 'three';
import { MeshBasicMaterial } from 'three';
import Drawing from "dxf-writer";

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

  const properties = await viewer.IFC.properties.serializeAllProperties(model);

  const file = new File(properties, 'properties.json');

  const link = document.createElement('a');
  document.body.appendChild(link);
  link.download = 'properties.json';
  link.href = URL.createObjectURL(file);
  link.click();
  link.remove();
}
