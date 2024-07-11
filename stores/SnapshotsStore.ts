import {defineStore} from 'pinia';
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import {ref} from "vue";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";

export const useSnapshotsStore = defineStore('snapshots', () => {

  let storage: SnapshotsPersistence = null as unknown as SnapshotsPersistence

  const metadata = ref<BlobMetadata[]>([])

  const lastUpdate = ref(0)

  async function initialize(ps: SnapshotsPersistence) {
    console.debug(" ...initializing snapshotsStore")
    storage = ps
    await storage.init()
    metadata.value = await storage.getMetadata()
    lastUpdate.value = new Date().getTime()
  }

  const saveHTML = async (id: string, url: string, html: string, remark: string | undefined = undefined): Promise<any> => {
    const res = await storage.saveHTML(id, url, new Blob([html], {
      type: 'text/html'
    }), BlobType.HTML, remark)
    lastUpdate.value = new Date().getTime()
    return res
  }

  const saveMHtml = async (id: string, url: string, mhtml: Blob, remark: string | undefined = undefined): Promise<string> => {
    const res = await storage.saveMHtml(id, url, mhtml, remark)
    lastUpdate.value = new Date().getTime()
    return res
  }

  const savePng = async (id: string, url: string, img: Blob, remark: string | undefined = undefined): Promise<any> => {
    const res = storage.savePng(id, url, img, BlobType.PNG, remark)
    lastUpdate.value = new Date().getTime()
    return res
  }

  const savePdf = async (id: string, url: string, img: Blob, remark: string | undefined = undefined): Promise<any> => {
    const res = storage.savePdf(id, url, img, BlobType.PDF, remark)
    lastUpdate.value = new Date().getTime()
    return res
  }

  const metadataFor = (sourceId: string): Promise<BlobMetadata[]> => {
    if (storage) {
      return storage.getMetadataFor(sourceId)
    }
    return Promise.resolve([])
  }

  const metadataById = (id: string): Promise<BlobMetadata> => {
    return storage.getMetadataById(id)
  }

  const blobFor = (id: string): Promise<Blob> => {
      return storage.getBlobFor(id)
  }

  const deleteBlob = async (blobId: string) => {
    console.log("deleting blob", blobId)
    await storage.deleteBlob(blobId)
    lastUpdate.value = new Date().getTime()
  }

  const createAnnotation = async (snapshotId: string, annotation: Annotation): Promise<Annotation[]> => {
    return await storage.addAnnotation(snapshotId, annotation)
  }

  const updateAnnotation = async (tabId: string, index: number, annotation: Annotation): Promise<Annotation[]> => {
    return await storage.updateAnnotation(tabId, index, annotation)
  }

  const deleteAnnotation = async (sourceId: string, toDelete: Annotation, index: number): Promise<Annotation[]> => {
    return storage.deleteAnnotation(sourceId, index, toDelete)
  }

  const deleteMetadataForSource = (snapshotId: string) => {
    storage.deleteMetadataForSource(snapshotId)
    lastUpdate.value = new Date().getTime()
  }

  return {
    initialize,
    lastUpdate,
    metadata,
    saveHTML,
    saveMHtml,
    savePng,
    savePdf,
    metadataFor,
    metadataById,
    blobFor,
    deleteBlob,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteMetadataForSource
  }
})
