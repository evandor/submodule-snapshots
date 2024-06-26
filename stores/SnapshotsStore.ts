import {defineStore} from 'pinia';
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import {ref} from "vue";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";

export const useSnapshotsStore = defineStore('snapshots', () => {

  let storage: SnapshotsPersistence = null as unknown as SnapshotsPersistence

  const metadata = ref<Map<string, BlobMetadata[]>>(new Map())

  const lastUpdate = ref(0)

  async function initialize(ps: SnapshotsPersistence) {
    console.debug(" ...initializing snapshotsStore")
    storage = ps
    await storage.init()
    metadata.value = await storage.getMetadata()
    lastUpdate.value = new Date().getTime()
  }

  const saveHTML = async (id: string, url: string, html: string, remark: string | undefined = undefined): Promise<any> => {
    const res = storage.saveHTML(id, url, new Blob([html], {
      type: 'text/html'
    }), BlobType.HTML, remark)
    lastUpdate.value = new Date().getTime()
    return res
  }

  const metadataFor = (sourceId: string, type: BlobType): Promise<BlobMetadata[]> => {
    return storage.getMetadataFor(sourceId, type)
  }

  const blobFor = (sourceId: string, index: number): Promise<Blob> => {
    return storage.getBlobFor(sourceId, index)
  }

  // const saveBlob = async (id: string, data: Blob): Promise<any> => {
  //   console.log(`saving blob for id ${id}`)
  //   const res = await storage.saveBlob(id, data)
  //   lastUpdate.value = new Date().getTime()
  //   return res
  // }
  //
  // const saveMetadata = async (id: string, url: string, type: BlobType, remark: string | undefined = undefined): Promise<any> => {
  //   console.log(`saving blob for id ${id}, url=${url}`)
  //   const res = await storage.saveMetadata(id, url, type, remark)
  //   lastUpdate.value = new Date().getTime()
  //   return res
  // }

  const deleteBlob = async (blobId: string) => {
    console.log("deleting blob", blobId)
    await storage.deleteBlob(blobId)
    lastUpdate.value = new Date().getTime()
  }

  const createAnnotation = async (tabId: string, index: number, annotation: Annotation) => {
    //console.log("createAnnotation", tabId, index, selection, text, rect, viewport, comment)
    //useSnapshotsStore().createAnnotation(tabId, tabId, index, selection, text, rect, viewport, comment)
    // const annotation = new Annotation(tabId, selection)
    console.log("annotation", annotation)
    await storage.addAnnotation(tabId, index, annotation)
  }

  const deleteAnnotation = async (sourceId: string, index: number, toDelete: Annotation) => {
    storage.deleteAnnotation(sourceId, index, toDelete)
  }

  const deleteMetadataForSource = (sourceId: string) => {
    storage.deleteMetadataForSource(sourceId)
  }

  return {
    initialize,
    lastUpdate,
    metadata,
    saveHTML,
    metadataFor,
    blobFor,
    deleteBlob,
    createAnnotation,
    deleteAnnotation,
    deleteMetadataForSource
  }
})
