<template>

  <div v-html="htmlSnapshot"></div>

  <div class="q-ma-lg q-pa-lg bg-white"
       style="position:absolute; top:20px; left:20px; z-index:20000;border:1px solid red;border-radius:3px;min-width:500px">

    <div class="row">
      <div class="col">
        <div class="row justify-start items-baseline">
          <div class="col-12"><span class="text-dark">Archived HTML Page for: {{ html?.url }}</span></div>
        </div>
        <div class="text-caption">Created {{ date.formatDate(html?.created, 'DD.MM.YYYY HH:mm') }}</div>
        <div class="text-caption">Size {{ Math.round((html?.content.size || 0) / 1024) }} kB</div>
      </div>
    </div>
    <div class="row" >
      <div class="col">
        <hr>
        <div class="q-pa-lg">
          <div class="q-gutter-md">
            <q-pagination
              v-model="current"
              :max="htmls.length"
              direction-links/>
          </div>
        </div>
        <hr>
      </div>
    </div>
  </div>

  <div class="q-ma-lg q-pa-lg bg-white" v-if="selectedText"
       style="position:absolute; top:20px; right:20px; z-index:20000;border:1px solid red;border-radius:3px; max-width:200px">
    <div class="text-body2">
      Selected: {{ selectedText }}<br>
    </div>
    <div class="text-body2" @click="restore()">
      Selection: {{ serializedSelection }}<br>
    </div>
  </div>


</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import {useUiStore} from "src/ui/stores/uiStore";
import Analytics from "src/core/utils/google-analytics";
import {BlobType, SavedBlob} from "src/snapshots/models/SavedBlob";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import {date} from "quasar";
import {useUtils} from "src/core/services/Utils";

const route = useRoute()
const {sanitizeAsHtml, serializeSelection, restoreSelection} = useUtils()


const tabId = ref<string>()
const blobId = ref<string>()
const htmls = ref<SavedBlob[]>([])
const html = ref<SavedBlob | undefined>(undefined)
const current = ref(0)
const iFrameRef = ref(null)
const htmlSnapshot = ref('loading...')
const selectedText = ref<string | undefined>(undefined)
const selection = ref<any>()
const serializedSelection = ref<any>()

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelHtmlPage', document.location.href);
  const iFrame = iFrameRef.value
  if (iFrame) {
    console.log("window.innerHeight", window.innerHeight)
    // @ts-ignore
    iFrame.setAttribute("style", "overflow:hidden;height:" + (window.innerHeight - 106) + "px;width:100%;border:0px");
  }

  // document.onselectionchange = () => {
  //   console.log("===", document.getSelection());
  // };

  document.onpointerup = () => {
    selection.value = document.getSelection()

    const text = selection.value.toString();
    console.log("===>", selection.value, text)
    if (text !== "" && selection.value.rangeCount > 0) {
      selectedText.value = text
      //console.log("range", selection.value.getRangeAt(0))
      serializedSelection.value = serializeSelection()
      console.log("===>", serializedSelection.value)
      // let rect = selection.getRangeAt(0).getBoundingClientRect();
      // control.style.top = `calc(${rect.top}px - 48px)`;
      // control.style.left = `calc(${rect.left}px + calc(${rect.width}px / 2) - 40px)`;
      // control['text']= text;
      // document.body.appendChild(control);
    }
  }
})

const setHtml = async (index: number) => {
  html.value = htmls.value[index] as unknown as SavedBlob | undefined
  if (html.value && html.value.content) {
    //var blob = new Blob(['<a id="a"><b id="b">hey!</b></a>'], {type : 'text/html'});
    const b: Blob = html.value.content as unknown as Blob
    const urlCreator = window.URL || window.webkitURL;
    window.URL.createObjectURL(new Blob([]));
    const newUrl = window.URL.createObjectURL(b);
    //htmlSnapshot.value = sanitizeAsHtml(await b.text());
    htmlSnapshot.value = await b.text();

    (document.getElementById("iframe")! as HTMLIFrameElement).src = newUrl;
  }

}

watchEffect(async () => {
  tabId.value = route.params.tabId as string
  blobId.value = route.params.blobId as string
  if (blobId.value && useUiStore().dbReady) {
    // const tabId = suggestion.value['data' as keyof object]['tabId' as keyof object]
    // console.log("got tabId", tabId)
    htmls.value = await useSnapshotsService().getBlobForTab(tabId.value, BlobType.HTML)
    console.log("pngs", htmls.value)
    await setHtml(0)
  }
})

watchEffect(() => {
  console.log("current", current.value)
  setHtml(current.value-1)
})

const restore = () => {
  selection.value.deleteFromDocument()
  restoreSelection(JSON.parse(JSON.stringify(serializedSelection.value)))
}

</script>
