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
  IFCMEMBER,
  IFCFLOWFITTING,
  IFCFLOWSEGMENT,
  IFCBUILDINGELEMENTPROXY
} from 'web-ifc'
import { LineBasicMaterial } from 'three';
import { MeshBasicMaterial } from 'three';
import Drawing from "dxf-writer";
import {Dexie} from "dexie";

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

// Get all Buttons

const saveButton = document.getElementById('save-button');
const loadButton = document.getElementById('load-button');
const removeButton = document.getElementById('remove-button');
const input = document.getElementById('file-input');


// Set up button logic

removeButton.onclick = () => removeDatabase();
loadButton.onclick = () => loadSavedModel();
saveButton.onclick = () => input.click();
input.onchange = () => preProcessAndSaveModel();

// Set up what buttons the user can click

updateButtons();

function updateButtons(){
  const modelsNames = localStorage.getItem('modelsNames');

  if(modelsNames){
    loadButton.classList.remove('disabled');
    removeButton.classList.remove('disabled');
    saveButton.classList.add('disabled');
  } else {
    loadButton.classList.add('disabled');
    removeButton.classList.add('disabled');
    saveButton.classList.remove('disabled');
  }
}

// Create a Database

const db = createOrOpenDatabase();

function createOrOpenDatabase(){

  const db = new Dexie("ModelDatabase");

  db.version(1).stores({
    bimModels: `
    name,
    id,
    category,
    level
    `
  });
    return db;
}

async function preProcessAndSaveModel(){
  const file = input.files[0];
  const url = URL.createObjectURL(file);

  const result = await viewer.GLTF.exportIfcFileAsGltf({
    ifcFileUrl: url,
    splitByFloors: true,
    categories:{
      walls: [IFCWALL, IFCWALLSTANDARDCASE],
      slabs: [IFCSLAB],
      windows: [IFCWINDOW],
      curtainwalls: [ IFCMEMBER, IFCPLATE, IFCCURTAINWALL],
      doors: [IFCDOOR],
    }
  });

  const models= [];

  for(const categoryName in result.gltf){
    const category = result.gltf[categoryName];
    for(const levelName in category){
      const file = category[levelName].file;
      if(file){

        const data = await file.arrayBuffer();

        models.push({
          name: result.id + categoryName + levelName,
          id: result.id,
          category: categoryName,
          level: levelName,
          file: data
        })
      }
    }
  }

  await db.bimModels.bulkPut(models);

  const names = models.map(model => model.name)
  const serializedNames = JSON.stringify(names);
  localStorage.setItem("modelsNames", serializedNames);
  location.reload();
}

async function loadSavedModel(){
  const serializedNames = localStorage.getItem("modelsNames");
  const names = JSON.parse(serializedNames);

  for(const name of names){
    const savedModel = await db.bimModels.where("name").equals(name).toArray();

    const data = savedModel[0].file;
    const file = new File([data], 'example');
    const url = URL.createObjectURL(file);
    await viewer.GLTF.loadModel(url);
  }

  loadButton.classList.add('disabled');
}


function removeDatabase(){
  localStorage.removeItem('modelsNames');
  db.delete();
  location.reload();
}
