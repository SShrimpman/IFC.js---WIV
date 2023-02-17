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
let model;
let allPlans;

async function loadIfc(url) {
		// Load the model
    model = await viewer.IFC.loadIfcUrl(url);
    toggleShadow();

		// Add dropped shadow and post-processing efect
    await viewer.shadowDropper.renderShadow(model.modelID);
    viewer.context.renderer.postProduction.active = true;

    await viewer.plans.computeAllPlanViews(model.modelID);

    // Floor Plan Navigation
    
    const lineMaterial = new LineBasicMaterial({color: 'black'});
    const baseMaterial = new MeshBasicMaterial({
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    viewer.edges.create('example-edges', model.modelID, lineMaterial, baseMaterial);

    const container = document.getElementById('button-container');
    allPlans = viewer.plans.getAll(model.modelID);

    for(const plan of allPlans){
      const currentPlan = viewer.plans.planLists[model.modelID][plan];
      console.log(currentPlan);
      
      const button = document.createElement('button');
      container.appendChild(button);
      button.textContent = currentPlan.name;
      button.onclick = () => {
        viewer.plans.goTo(model.modelID, plan);
        viewer.edges.toggle('example-edges', true);
        togglePostProduction(false);
        toggleShadow(false);
      }
    }

    const button = document.createElement('button');
    container.appendChild(button);
    button.textContent = 'Exit floorplans';
    button.onclick = () => {
      viewer.plans.exitPlanView();
      viewer.edges.toggle('example-edges', false);
      togglePostProduction(true);
      toggleShadow(true);
    }

  // Floor Plan Export

  const project = await viewer.IFC.getSpatialStructure(model.modelID);

  const storeys = project.children[0].children[0].children;
  for(const storey of storeys){
    for(const child of storey.children){
      if(child.children.lenght){
        storey.children.push(...child.children);
      }
    }
  }

  viewer.dxf.initializeJSDXF(Drawing);

  for(const plan of allPlans){
    const currentPlan = viewer.plans.planLists[model.modelID][plan];

    const button = document.createElement('button');
    container.appendChild(button);
    button.textContent = 'Export' + currentPlan.name;
    button.onclick = async () => {
      const storey = storeys.find(storey => storey.expressID === currentPlan.expressID);
      exportDXF(storey, currentPlan, model.modelID);
    }
  }

}

function toggleShadow(active){
  const shadows = Object.values(viewer.shadowDropper.shadows);
  for(shadow of shadows){
    shadow.root.visible = active;
  }
}

function togglePostProduction(active) {
  viewer.context.renderer.postProduction.active = active;
}

const dummySubsetMaterial = new MeshBasicMaterial({visible: false});

async function exportDXF(storey, plan, modelID){
  // Create a new Drawing (if doesn't exit)
  if(!viewer.dxf.drawings[plan.name]) {
    viewer.dxf.newDrawing(plan.name);
  }

  const ids = storey.children.map(item => item.expressID);

  if(!ids) return;

  const subset = viewer.IFC.loader.ifcManager.createSubset({
    modelID,
    ids,
    removePrevious: true,
    customID: 'floor_plan_generation',
    material: dummySubsetMaterial
  });

  const filteredPoints = [];
  const edges = await viewer.edgesProjector.projectEdges(subset);
  const positions = edges.geometry.attributes.position.array;

  const tolerance = 0.1;
  for(let i = 0; i < positions.length - 5; i += 6) {
    
    const a = positions[i] - positions[i + 3];
    // Z coords are multiplied by -1 to match the DXF Y coordinate
    const b = -positions[i + 2 ] + positions[i + 5];

    const distance = Math.sqrt(a * a + b * b);

    if(distance > tolerance) {
      filteredPoints.push([positions[i], -positions[i + 2], positions[i + 3], -positions[i + 5]]);
    }

  }

  viewer.dxf.drawEdges(plan.name, filteredPoints, 'Projection', Drawing.ACI.BLUE, 'CONTINOUS');

  edges.geometry.dispose();

  viewer.dxf.drawNamedLayer(plan.name, plan, 'thick', 'Section', Drawing.ACI.RED, 'CONTINOUS');
  viewer.dxf.drawNamedLayer(plan.name, plan, 'thin', 'Section', Drawing.ACI.RED, 'CONTINOUS');

  const result = viewer.dxf.exportDXF(plan.name);
  const link = document.createElement('a');
  link.download = 'floorplan.dxf';
  link.href = URL.createObjectURL(result);
  document.body.appendChild(link);
  link.click();
  link.remove();

}