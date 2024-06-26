<template>

  <div v-html="htmlSnapshot"></div>

  <div class="q-ma-lg q-pa-lg bg-white" :style="mainOverlayStyle()" id="mainOverlay">

    <div class="row">
      <div class="col">
        <div class="row justify-start items-baseline">
          <div class="col-12"><span class="text-dark ellipsis">Archived HTML Page for: {{ html?.url }}</span></div>
        </div>
        <div class="text-caption">Created {{ date.formatDate(html?.created, 'DD.MM.YYYY HH:mm') }}</div>
        <div class="text-caption">Size {{ Math.round((currentBlob?.size || 0) / 1024) }} kB</div>
      </div>
    </div>
    <div class="row" v-if="htmlMetadata.length > 1">
      <div class="col">
        <hr>
        <div class="q-pa-lg">
          <div class="q-gutter-md">
            <q-pagination
              v-model="current"
              :max="htmlMetadata.length"
              direction-links/>
          </div>
        </div>
        <hr>
      </div>
    </div>
    <template v-if="annotations.length > 0">
      <div class="row" v-for="(a,index) in annotations">
        <div class="col-9 ellipsis">
          {{ a.text }}
        </div>
        <div class="col-3">
          <q-btn icon="visibility" class="q-ma-none" size="xs" @click="restoreAnnotation(a)"/>
          <q-btn icon="delete" class="q-ma-none" size="xs" @click="deleteAnnotation(a, index)"/>
        </div>
      </div>
    </template>

  </div>

  <template v-if="annotations.length > 0" v-for="(a,index) in annotations">
    <div class="bibbly_annotationHint" :style="annotationHintOverlay(a,index)">
      <q-btn size="xs" icon="west" />
    </div>
  </template>

  <div v-if="selectedText" :style="menuOverlayStyle()" class="bibbly_menuOverlay" id="menuOverlay">
    <template v-if="overlayView === 'menu'">
      <div class="text-body2">
        <q-btn icon="o_save" class="q-ma-none q-pa-none" @click="showAddAnnotationForm()">
          <q-tooltip>Save selection</q-tooltip>
        </q-btn>
      </div>
    </template>
    <template v-else>
      <div class="row">
        <div class="col-8 text-body2">
          <q-input dense type="text" v-model="comment"/>
        </div>
        <div class="col-4 text-body2">
          <q-btn label="submit" @click="createAnnotation()"/>
        </div>
      </div>
    </template>
  </div>


</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import {useUiStore} from "src/ui/stores/uiStore";
import Analytics from "src/core/utils/google-analytics";
import {date} from "quasar";
import {useUtils} from "src/core/services/Utils";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {Annotation} from "src/snapshots/models/Annotation";

const route = useRoute()
const {sanitizeAsHtml, serializeSelection, restoreSelection} = useUtils()


const tabId = ref<string>()
const blobId = ref<string>()
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

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelHtmlPage', document.location.href);

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
          height: document.body.scrollHeight
        }
        // control.style.top = `calc(${rect.top}px - 48px)`;
        // control.style.left = `calc(${rect.left}px + calc(${rect.width}px / 2) - 40px)`;
        // control['text']= text;
        // document.body.appendChild(control);
      }
    }
  }
})

const setHtml = async (index: number) => {
  //html.value = currentBlob.value //htmls.value[index] as unknown as SavedBlob | undefined
  if (currentBlob.value) {
    //var blob = new Blob(['<a id="a"><b id="b">hey!</b></a>'], {type : 'text/html'});
    //const b: Blob = html.value.content as unknown as Blob
    const urlCreator = window.URL || window.webkitURL;
    window.URL.createObjectURL(new Blob([]));
    const newUrl = window.URL.createObjectURL(currentBlob.value);
    // htmlSnapshot.value = sanitizeAsHtml(await currentBlob.value.text());
    htmlSnapshot.value = await currentBlob.value.text()
    //console.log("htmlSnapshot", htmlSnapshot.value)
    //htmlSnapshot.value = await b.text();

  }

}

watchEffect(async () => {
  tabId.value = route.params.tabId as string
  blobId.value = route.params.blobId as string
  if (blobId.value && useUiStore().dbReady) {
    htmlMetadata.value = await useSnapshotsService().getMetadataFor(tabId.value, BlobType.HTML)
    console.log("metadata", htmlMetadata.value)

    const index = route.query['i'] as unknown as number || 0
    currentBlob.value = await useSnapshotsService().getBlobFor(tabId.value, index)
    await setHtml(index)

    current.value = index


  }
})

const setAnnotations = (as: Annotation[]) => {
  as.forEach((a: Annotation) => {
    console.log("found annotation", a)
    restoreSelection(a.selection)
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
  restoreSelection(JSON.parse(JSON.stringify(serializedSelection.value)))
}

window.onscroll = function () {
  scrollX.value = window.scrollX
  scrollY.value = window.scrollY
};

const mainOverlayStyle = () => {
  return `position:absolute; top:${20 + scrollY.value}px; left:20px; z-index:20000;border:1px solid red;border-radius:3px;max-width:500px`
}
const menuOverlayStyle = () => {
  const top = -40 + scrollY.value + selectionRect.value['y' as keyof object]
  const left = -5 + scrollX.value + selectionRect.value['x' as keyof object]
  return `top:${-20 + top}px; left:${left}px;`
}

const annotationHintOverlay = (a: Annotation, i: number) => {
  const top = Math.round(a.rect['y' as keyof object])
  return `position:absolute; top:${top}px; right:20px; z-index:20002;border:1px solid grey;border-radius:2px`
}

const showAddAnnotationForm = () => {
  overlayView.value = 'form'
  // console.log("fixing selection to", serializedSelection.value)
  fixedSelection.value = serializedSelection.value
}

const createAnnotation = async () => {
  const as = await useSnapshotsService().createAnnotation(tabId.value || '', current.value, fixedSelection.value, selectedText.value, selectionRect.value, viewPort.value, comment.value)
  setAnnotations(as)
  overlayView.value = 'menu'
  restore()
}

const restoreAnnotation = (a: Annotation) => {
  console.log("restoring selection", a.selection)
  restoreSelection(a.selection)
}

const deleteAnnotation = async (a: Annotation, i: number) => {
  console.log("deleting annotation", a.selection)
  const remainingAnnotations = await useSnapshotsService().deleteAnnotation(tabId.value!, a, i)
  setAnnotations(remainingAnnotations)
}

</script>

<!--<style>-->
<!--::selection {-->
<!--  color: red;-->
<!--  background-color: yellow;-->
<!--}-->

<!--</style>-->

<style scoped>

.bibbly_menuOverlay {
  position:absolute;
  margin:0;
  padding:5px;
  background-color:white;
  min-width:50px;
  z-index:20001;
  border:1px solid grey;
  border-radius:2px;
}

.bibbly_annotationHint {
  position:absolute;
  padding:2px;
  right:20px;
  z-index:20002;
  border:1px solid grey;
  border-radius:2px;
  background-color:white;
}
</style>
