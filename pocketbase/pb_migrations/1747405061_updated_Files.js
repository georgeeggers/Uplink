/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_213045686")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file1542800728",
    "maxSelect": 1,
    "maxSize": 25000000000,
    "mimeTypes": [],
    "name": "data",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": [
      "256x256"
    ],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_213045686")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file1542800728",
    "maxSelect": 1,
    "maxSize": 25000000000,
    "mimeTypes": [],
    "name": "data",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
