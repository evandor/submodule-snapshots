<template>

  <div style="position: absolute; left: 50%; top:20%;width:400px">
    <div style="position: relative; left: -50%; border: dotted red 2px; border-radius:6px">

      <div class="column q-ma-lg q-pa-lg">
        <div class="col q-my-md text-bold">
          This is an archived Snapshot of your Source<br>
        </div>

        <div class="col" v-if="htmlMetadata?.url">
          {{ htmlMetadata?.url }}
        </div>
        <div class="col" v-else>
          <q-spinner-facebook
            color="primary"
            size="2em"
          />
        </div>

        <div class="col q-my-md" v-if="!initialProceedToPage">
          Archived Snapshots may not look exactly like their originals, but they will not change in future.
        </div>
        <div class="col" v-if="!initialProceedToPage">
          <q-checkbox label="skip future acknowledgments" v-model="proceedToPage"></q-checkbox>
        </div>
        <div class="col q-my-md" v-if="!initialProceedToPage">
          <span class="cursor-pointer text-blue-10 text-bold" @click="loadArchivedPage()">Got it!</span>
        </div>
        <div class="col q-my-md" v-if="initialProceedToPage && htmlMetadata?.url">
          redirecting...
        </div>
      </div>


    </div>
  </div>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import Analytics from "src/core/utils/google-analytics";
import {useUtils} from "src/core/services/Utils";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import {BlobMetadata} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";
import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";
import {useQuasar} from "quasar";
import * as cheerio from "cheerio";
import _ from "lodash"

const route = useRoute()
const {sanitizeAsHtml, serializeSelection, sendMsg, restoreSelection} = useUtils()

const snapshotId = ref<string>()
const editable = ref<boolean>(route.query.edit as string === "true")
const htmlMetadata = ref<BlobMetadata | undefined>(undefined)
const html = ref<BlobMetadata | undefined>(undefined)
const currentBlob = ref<Blob | undefined>(undefined)
const current = ref(0)
const htmlSnapshot = ref('loading...')
const selectedText = ref<string | undefined>(undefined)
const selection = ref<any>()
const serializedSelection = ref<any>()
const scrollX = ref(0)
const scrollY = ref(0)
const selectionRect = ref<object>({})
const viewPort = ref<object>({})
const annotations = ref<Annotation[]>([])
const proceedToPage = ref(false)

const localStorage = useQuasar().localStorage

const initialProceedToPage = localStorage.getItem('ui.proceedToArchivedPage')
console.log("initialProceedtopage", initialProceedToPage)

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelHtmlPage', document.location.href)


  proceedToPage.value = localStorage.getItem('ui.proceedToArchivedPage') || false

  document.onpointerup = (e: any) => {

    const mainOverlayElement = document.getElementById('mainOverlay');
    const menuOverlayElement = document.getElementById('menuOverlay');

    // avoid reacting on clicks on overlays
    if (mainOverlayElement) {
      if (!(e.target !== mainOverlayElement && !mainOverlayElement.contains(e.target))) {
        return
      }
    }
    if (menuOverlayElement) {
      if (!(e.target !== menuOverlayElement && !menuOverlayElement.contains(e.target))) {
        return
      }
    }

    const documentSelection = document.getSelection()
    //console.log("new selection:", documentSelection?.type, documentSelection)
    selectedText.value = undefined
    if (documentSelection?.type === "Range") {
      console.log("selection changed!")
      selection.value = documentSelection
      const text = selection.value.toString();
      console.log("===>", selection.value, text)
      if (text !== "" && selection.value.rangeCount > 0) {
        selectedText.value = text
        //console.log("range", selection.value.getRangeAt(0))
        serializedSelection.value = serializeSelection()
        //console.log("===>", serializedSelection.value)
        selectionRect.value = selection.value.getRangeAt(0).getBoundingClientRect();
        //console.log("rect", selectionRect.value)
        viewPort.value = {
          width: document.body.scrollWidth,
          height: document.body.scrollHeight// + document.body.scrollY
        }
        sendMsg('text-selection', {
          snapshotId: snapshotId.value,
          text: selectedText.value,
          selection: serializedSelection.value,
          rect: selectionRect.value,
          viewPort: viewPort.value
        })
        // control.style.top = `calc(${rect.top}px - 48px)`;
        // control.style.left = `calc(${rect.left}px + calc(${rect.width}px / 2) - 40px)`;
        // control['text']= text;
        // document.body.appendChild(control);
      }
    }
  }
})

watchEffect(async () => {
  snapshotId.value = route.params.snapshotId as string
  console.log(`got snapshotId ${snapshotId.value}`)
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.name === "restore-selection") {
    restoreSelection(message.data.selection, undefined, message.data.rect, message.data.viewport, message.data.color)
  }
  sendResponse("done")
  return true
})

function cssLeaves(selectors: string[]): string {
  return _.join(_.map(selectors, (s: string) => s + ":not(:has(*))"), ",")
}

const setHtml = async () => {
  //html.value = currentBlob.value //htmls.value[index] as unknown as SavedBlob | undefined
  if (currentBlob.value) {
    console.log("route.path", route.path)
    if (route.path.toLowerCase().startsWith("/mainpanel/html")) {
      window.URL.createObjectURL(new Blob([]));
      const c = await currentBlob.value.text()
      const htmlBlob = c
      const $ = cheerio.load(htmlBlob);
      if (editable.value) {
        const editableSelector = `${cssLeaves(["h1", "h2", "h3", "h4", "h5", "h6", "p", "span"])}`
        $(editableSelector).each(function () {
          // $(this).after('<span contenteditable="true" style="background-color:yellow">+</span>');
          $(this).attr("contenteditable", "true");
          // $(this).attr("onblur", "alert('hier')")
        });
      }

      htmlSnapshot.value = $.html()

    } else {
      htmlSnapshot.value = await currentBlob.value.text()
      console.log("====>", htmlSnapshot.value)
    }


    //console.log("resulting htmlSnapshot", htmlSnapshot.value)

    if (localStorage.getItem('ui.proceedToArchivedPage')) {
      setTimeout(() => {
        loadArchivedPage()
      }, 500)
    }

  }

}

const loadArchivedPage = () => {
  localStorage.set('ui.proceedToArchivedPage', proceedToPage.value)
  // document.documentElement.innerHTML = htmlSnapshot.value

  document.open("text/html", "replace");
  document.write(htmlSnapshot.value);
  document.close();
  // document.body.insertAdjacentHTML('beforeend',htmlSnapshot.value);
}

watchEffect(async () => {
  if (snapshotId.value && useSnapshotsStore().lastUpdate) {
    htmlMetadata.value = await useSnapshotsService().getMetadataById(snapshotId.value)
    if (htmlMetadata.value) {
      console.log("metadata", htmlMetadata.value)
      currentBlob.value = await useSnapshotsService().getBlobFor(htmlMetadata.value.blobId)
      await setHtml()
    }
    //current.value = index
  }
})

const setAnnotations = (as: Annotation[]) => {
  as.forEach((a: Annotation) => {
    console.log("found annotation", a)
    restoreSelection(a.selection, undefined, a.rect, a.viewport, a.color)
    // restoreSelection(JSON.parse(JSON.stringify(a.selection)))
  })
  annotations.value = as
}

watchEffect(() => {
  //console.log("===>", current.value, htmlMetadata.value)
  if (htmlMetadata.value) {
    const as = htmlMetadata.value?.annotations || []
    setAnnotations(as)
  }
})

watchEffect(() => {
//  console.log("current", current.value)
  setHtml()
})

window.onscroll = function () {
  scrollX.value = window.scrollX
  scrollY.value = window.scrollY
};

</script>
