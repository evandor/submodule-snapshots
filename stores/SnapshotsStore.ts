import {defineStore} from 'pinia';
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import {ref} from "vue";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";

export const useSnapshotsStore = defineStore('snapshots', () => {

  let storage: SnapshotsPersistence = null as unknown as SnapshotsPersistence

  const snapshotKeys = ref<String[]>([])

  const lastUpdate = ref(0)

  async function initialize(ps: SnapshotsPersistence) {
    console.debug(" ...initializing snapshotsStore", ps.getServiceName())
    storage = ps
    await storage.init()
    snapshotKeys.value = await storage.getBlobKeys()
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

  const blobFor = (sourceId: string,index:number): Promise<Blob> => {
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

  const deleteBlob = async (tabId: string, elementId: string) => {
    console.log("deleting blob", tabId, elementId)
    await storage.deleteBlob(tabId, elementId)
    lastUpdate.value = new Date().getTime()
  }

  return {
    initialize,
    lastUpdate,
    saveHTML,
    metadataFor,
    blobFor,
    deleteBlob
  }
})
