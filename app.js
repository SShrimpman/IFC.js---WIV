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

loadIfc("./01.ifc");

async function loadIfc(url) {
  const model = await viewer.IFC.loadIfcUrl(url);
  await viewer.shadowDropper.renderShadow(model.modelID);
  viewer.context.renderer.postProduction.active = true;

  const walls = await viewer.IFC.getAllItemsOfType(model.modelID, IFCWALLSTANDARDCASE, true);

  const table = document.getElementById('bim-table');
  const body = table.querySelector('tbody');

  for(const wall of walls) {
    createWallNameEntry(body, wall);

    for(const propertyName in wall){
      const propertyValue = wall[propertyName];
      createPropertyEntry(body, propertyName, propertyValue);
    }
  }

  const exportButton = document.getElementById('export');
  exportButton.onclick = () => {
    const book = XLSX.utils.table_to_book(table);
    XLSX.writeFile(book, 'Walls_Table.xlsx');

  }
}

function createWallNameEntry(tableBody, wall){
  const row = document.createElement('tr');
  tableBody.appendChild(row);

  const wallName = document.createElement('td');
  wallName.colSpan = 2;
  wallName.textContent = 'Wall' + wall.GlobalId.value;
  row.appendChild(wallName);
}

function createPropertyEntry(tableBody, name, value){
  const row = document.createElement('tr');
  tableBody.appendChild(row);

  const propertyName = document.createElement('td');
  name = decodeIFCString(name);
  propertyName.textContent = name;
  row.appendChild(propertyName);

  if( value === null || value === undefined) value = "Unknown";
  if (value.value) value = value.value;
  value = decodeIFCString(value);

  const propertyValue = document.createElement('td');
  propertyValue.textContent = value;
  row.appendChild(propertyValue);
}

function decodeIFCString (ifcString) {
  const ifcUnicodeRegEx = /\\X2\\(.*?)\\X0\\/uig;
  let resultString = ifcString;
  let match = ifcUnicodeRegEx.exec (ifcString);
  while (match){
    const unicodeChar = String.fromCharCode (parseInt(match[1], 16));
    resultString = resultString.replace(match[0], unicodeChar);
    match = ifcUnicodeRegEx.exec (ifcString);
  }
  return resultString;
}
