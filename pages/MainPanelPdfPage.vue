<template>

  <q-page padding>
    <q-toolbar class="text-primary">
      <div class="row fit">
        <div class="col-xs-12 col-md-5">
          <q-toolbar-title class="q-mb-lg">
            <div class="row justify-start items-baseline">
              <div class="col-1"><span class="text-dark">Archived PDF for: {{ pdf }}</span></div>
            </div>
            <div class="text-caption">Created  date.formatDate(pdf?.created, 'DD.MM.YYYY HH:mm') </div>
            <div class="text-caption">Size {{ Math.round((pdf?.content.size || 0) / 1024) }} kB</div>
          </q-toolbar-title>
        </div>
        <div class="col-xs-12 col-md-7 text-right">

          <!--          <q-btn-->
          <!--            flat dense icon="o_open_in_new"-->
          <!--            color="green"-->
          <!--            label="Open in new tab"-->
          <!--            class="q-mr-md"-->
          <!--            @click="openInNewTab">-->
          <!--            <q-tooltip>Open in new tab</q-tooltip>-->
          <!--          </q-btn>-->

        </div>
      </div>
    </q-toolbar>

    <div class="row">
      <div class="col">
        <hr>
        <div class="q-pa-lg">
          <div class="q-gutter-md">
            <q-pagination
              v-model="current"
              :max="pdfs.length"
              direction-links/>


          </div>
        </div>
        <hr>
      </div>
    </div>

    <object :data="pdfData" type="application/pdf" width="100%" :height="heightFromViewport()">
      <p>Unable to display PDF file.</p>
    </object>


  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import {date} from "quasar"
import {useUiStore} from "src/ui/stores/uiStore";
import Analytics from "src/core/utils/google-analytics";

import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import {SavedBlob} from "src/snapshots/models/SavedBlob";

const route = useRoute()

const tabId = ref<string>()
const blobId = ref<string>()
const pdfs = ref<SavedBlob[]>([])
const pdf = ref<SavedBlob | undefined>(undefined)
const current = ref(2)
const pdfData = ref<any>()

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelPdfPage', document.location.href);
})

function setImage(index: number) {
  //png.value = _.first(_.filter(pngs.value, (p:SavedBlob) => p.id === blobId.value))
  pdf.value = pdfs.value[index]
  if (!pdf.value) {
    return
  }
  var urlCreator = window.URL || window.webkitURL;
  pdfData.value = urlCreator.createObjectURL(pdf.value.content);
  // const img1: HTMLImageElement | null = document.querySelector("#monitoringStartImg")
  // if (img1) {
  //   img1.src = imageUrl;
  // }

}

watchEffect(async () => {
  tabId.value = route.params.tabId as string
  blobId.value = route.params.blobId as string
  if (blobId.value && useUiStore().dbReady) {
    // const tabId = suggestion.value['data' as keyof object]['tabId' as keyof object]
    // console.log("got tabId", tabId)
    //pdfs.value = await useSnapshotsService().getPdfsForTab(tabId.value)
    console.log("pdfs", pdfs.value)
    setImage(0);
  }
})

watchEffect(() => {
  console.log("current", current.value)
  setImage(current.value - 1)
})

const heightFromViewport = () => {
  return (window.innerHeight - 250) + 'px'
}
</script>
