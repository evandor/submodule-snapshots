<template>

  <!--      <iframe :srcdoc="iframeSource" width="100%" height="1000px" />-->


  <!--  <replay-web-page source="https://replayweb.page/docs/examples/tweet-example.wacz"-->
  <!--                   url="https://oembed.link/https://twitter.com/webrecorder_io/status/1565881026215219200"></replay-web-page>-->

  <!--  <div v-html="htmlSnapshot"></div>-->

  <div style="position: absolute; left: 50%; top:20%;width:400px">
    <div style="position: relative; left: -50%; border: dotted red 2px; border-radius:6px">

      <div class="column q-ma-lg q-pa-lg">
        <div class="col q-my-md text-bold">
          This is an archived Snapshot of your Source<br>
        </div>

        <div class="col" v-if="htmlMetadata[current]?.url">
          {{ htmlMetadata[current]?.url }}
        </div>
        <div class="col" v-else>
          <q-spinner-facebook
            color="primary"
            size="2em"
          />
        </div>

        <div class="col q-my-md" v-if="!proceedToPage">
          Archived Snapshots may not look exactly like their originals, but they will not change in future.
        </div>
        <div class="col" v-if="!proceedToPage">
          <q-checkbox label="skip future acknowledgments" v-model="proceedToPage"></q-checkbox>
        </div>
        <div class="col q-my-md" v-if="!proceedToPage">
          <span class="cursor-pointer text-blue-10 text-bold" @click="loadArchivedPage()">Got it!</span>
        </div>
        <div class="col q-my-md" v-if="proceedToPage && htmlMetadata[current]?.url">
          redirecting...
        </div>
      </div>


    </div>
  </div>

  <!--  <div :style="mainOverlayStyle()" class="bibbly_mainOverlay" id="mainOverlay">-->


</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import Analytics from "src/core/utils/google-analytics";
import {useUtils} from "src/core/services/Utils";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";
import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";
import mhtml2html from 'mhtml2html';
import {useQuasar} from "quasar";
import * as cheerio from "cheerio";

const route = useRoute()
const {sanitizeAsHtml, serializeSelection, sendMsg, restoreSelection} = useUtils()

const tabId = ref<string>()
const blobId = ref(0)
const htmlMetadata = ref<BlobMetadata[]>([])
const html = ref<BlobMetadata | undefined>(undefined)
const currentBlob = ref<Blob | undefined>(undefined)
const current = ref(0)
const htmlSnapshot = ref('loading...')
const selectedText = ref<string | undefined>(undefined)
const selection = ref<any>()
const fixedSelection = ref<any>()
const serializedSelection = ref<any>()
const scrollX = ref(0)
const scrollY = ref(0)
const comment = ref('')
const selectionRect = ref<object>({})
const viewPort = ref<object>({})
const overlayView = ref('menu')
const annotations = ref<Annotation[]>([])
const proceedToPage = ref(false)

const localStorage = useQuasar().localStorage

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelHtmlPage', document.location.href);

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.name === "restore-selection") {
    restoreSelection(message.data.selection, undefined, message.data.rect, message.data.viewport, message.data.color)
  }
  sendResponse("done")
  return true
})

const setHtml = async (index: number) => {
  //html.value = currentBlob.value //htmls.value[index] as unknown as SavedBlob | undefined
  if (currentBlob.value) {
    const urlCreator = window.URL || window.webkitURL;
    window.URL.createObjectURL(new Blob([]));
    const c = await currentBlob.value.text()
    const converted = mhtml2html.convert(c)


    const css = converted.window.document.createElement('style');
    // // my_awesome_script.setAttribute('src','http://example.com/site.js');
    // my_awesome_script.text = "document.onpointerup = (e: any) => {alert(document.selection)}"
    css.type = 'text/css';
    css.appendChild(converted.window.document.createTextNode("::selection {color: red;background-color: yellow;}"));
    // css.appendChild(converted.window.document.createTextNode("[contenteditable=\"true\"]:focus {background-color: orange;}"));
    converted.window.document.head.appendChild(css);

    const overlayDiv = converted.window.document.createElement('div')
    //overlayDiv.style.text = "position: absolute; left: 50%; top:20%"
    overlayDiv.innerText = "Bibbly Snapshot   "
    overlayDiv.style.cssText = 'margin:3px 3px; padding:5px 5px; position:absolute;top:5px;right:5px;width:150px;border:2px solid red;border-radius:3px;z-index:2147483647;background-color:white';

    const overlayImg = converted.window.document.createElement('img')
    overlayImg.src = "icons/favicon-32x32.png"
    overlayImg.height = "18"

    const overlayBtn = converted.window.document.createElement('button')
    overlayBtn.id = "snapshots_edit_btn"
    overlayBtn.type = "button"
    overlayBtn.innerText = "Edit"

    overlayDiv.appendChild(overlayImg)
    //overlayDiv.appendChild(overlayBtn)

    converted.window.document.body.appendChild(overlayDiv)

    const htmlBlob = converted.window.document.documentElement.innerHTML

    const $ = cheerio.load(htmlBlob);
    // $("h1,h2,h3,h4,h5,h6,div,p").each(function () {
    //    // $(this).after('<span contenteditable="true" style="background-color:yellow">+</span>');
    //   // $(this).attr("contenteditable", "true");
    // });


    const innerHtml = $.html()
    // return Promise.resolve({
    //   html: innerHtml,
    //   title: mhtml.title,
    //   created: mhtml.created
    // })


    htmlSnapshot.value = innerHtml
    console.log("resulting htmlSnapshot", htmlSnapshot.value)
    //htmlSnapshot.value = await b.text();

    const html = htmlSnapshot.value

    if (proceedToPage.value) {
      setTimeout(() => {
        loadArchivedPage()
      }, 500)
    }

  }

}

const loadArchivedPage = () => {
  localStorage.set('ui.proceedToArchivedPage', proceedToPage.value)
  document.documentElement.innerHTML = htmlSnapshot.value
}

watchEffect(async () => {
  tabId.value = route.params.tabId as string
  // blobId.value = route.params.blobId as string
  blobId.value = route.params.blobIndex as unknown as number
  console.log(`got tabId ${tabId.value} and blobId ${blobId.value}`)

})

watchEffect(async () => {
  if (blobId.value && tabId.value) {
    if (useSnapshotsStore().lastUpdate) {
      htmlMetadata.value = await useSnapshotsService().getMetadataFor(tabId.value!, BlobType.HTML)
      console.log("metadata", htmlMetadata.value)
      const index = route.query['i'] as unknown as number || 0
      currentBlob.value = await useSnapshotsService().getBlobFor(tabId.value!, index)
      await setHtml(index)
      current.value = index


//       async function readWARC(url: string) {
//         const response = await fetch(url);
// // console.log("response body", response.body)
//         const parser = new WARCParser(response.body!);
//
//         for await (const record of parser) {
//           // ways to access warc data
//           // console.log(record.warcType);
//           // console.log(record.warcTargetURI);
//           // console.log(record.warcHeader("WARC-Target-URI"));
//           // console.log(record.warcHeaders.headers.get("WARC-Record-ID"));
//
//           // iterator over WARC content one chunk at a time (as Uint8Array)
//           // for await (const chunk of record) {
//           //   console.log("chunk", chunk)
//           // }
//
//           // access content as text
//           const text = await record.contentText();
//           console.log("text", text)
//         }
//       }
//
//       await readWARC("https://firebasestorage.googleapis.com/v0/b/bibbly-dev.appspot.com/o/users%2Fx701JPs6dye8p8sLMxxXF8ONr9B2%2FsnapshotBlobs%2F3caba87e-cdb9-4508-87f5-ebbc2639586f?alt=media&token=d8e7b3d6-165d-4aa3-a34a-09209fd42576");
    }
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
  console.log("===>", current.value, htmlMetadata.value)
  if (htmlMetadata.value) {
    const as = htmlMetadata.value[current.value]?.annotations || []
    setAnnotations(as)
  }
})

watchEffect(() => {
  console.log("current", current.value)
  setHtml(current.value)
})

const restore = () => {
  selection.value.deleteFromDocument()
  restoreSelection(JSON.parse(JSON.stringify(serializedSelection.value)), undefined, {}, {})
}

window.onscroll = function () {
  scrollX.value = window.scrollX
  scrollY.value = window.scrollY
};

// const mainOverlayStyle = () => {
//   return `top:${40 + scrollY.value}px;`
// }
//
// const menuOverlayStyle = () => {
//   const top = -40 + scrollY.value + selectionRect.value['y' as keyof object]
//   const left = -5 + scrollX.value + selectionRect.value['x' as keyof object]
//   return `top:${-20 + top}px; left:${left}px;`
// }

// const annotationHintOverlay = (a: Annotation, i: number) => {
//   const top = Math.round(a.rect['y' as keyof object])
//   return `position:absolute; top:${top}px; right:20px; z-index:20002;border:1px solid grey;border-radius:2px`
// }
//
// const showAddAnnotationForm = () => {
//   overlayView.value = 'form'
//   // console.log("fixing selection to", serializedSelection.value)
//   fixedSelection.value = serializedSelection.value
// }

// const createAnnotation = async () => {
//   const as = await useSnapshotsService().createAnnotation(tabId.value || '', current.value, fixedSelection.value, selectedText.value, selectionRect.value, viewPort.value, comment.value)
//   setAnnotations(as)
//   overlayView.value = 'menu'
//   restore()
// }

// const restoreAnnotation = (a: Annotation) => {
//   console.log("restoring selection", a.selection)
//   restoreSelection(a.selection)
// }

// const deleteAnnotation = async (a: Annotation, i: number) => {
//   console.log("deleting annotation", a.selection)
//   const remainingAnnotations = await useSnapshotsService().deleteAnnotation(tabId.value!, a, i)
//   setAnnotations(remainingAnnotations)
// }

</script>

<!--<style>-->
<!--::selection {-->
<!--  color: red;-->
<!--  background-color: yellow;-->
<!--}-->

<!--</style>-->

<style scoped>

.bibbly_mainOverlay {
  position: absolute;
  left: 20px;
  margin: 0;
  padding: 5px;
  background-color: white;
  min-width: 50px;
  z-index: 20000;
  border: 1px solid red;
  border-radius: 2px;
}

.bibbly_menuOverlay {
  position: absolute;
  margin: 0;
  padding: 5px;
  background-color: white;
  min-width: 50px;
  z-index: 20001;
  border: 1px solid grey;
  border-radius: 2px;
}

.bibbly_annotationHint {
  position: absolute;
  padding: 2px;
  right: 20px;
  z-index: 20002;
  border: 1px solid grey;
  border-radius: 2px;
  background-color: white;
}

</style>
