import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import _ from "lodash";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";

export class SavePdfCommand implements Command<string> {

  constructor(public id: string, public url: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    console.log("executing save pdf command");
    const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({currentWindow: true})

    const tabcandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === this.url)
    if (tabcandidates.length > 0) {
      console.log("about to capture pdf")

      const chromeTab = tabcandidates[0]

      chrome.tabs.sendMessage(
        chromeTab.id || 0,
        "getContent",
        {},
        async (res) => {
         // console.log("msg: ",res)
          console.log("getContent returned result with length", res?.html?.length, chromeTab.id)
          // let html = await ContentUtils.setBaseHref(tabCandidates[0].url || '', res.content)
          let html = res.html
          return useSnapshotsService().pdfFrom(html)
            .then((res: any) => {
              console.log("res", res, typeof res)
              console.log("res2", typeof res.data)

              useSnapshotsService().savePdf(this.id, chromeTab.url || '', res.data)
              // useSnapshotsService().saveHTML(this.saveAsId, this.chromeTab.url || '', html, this.remark)

              return new ExecutionResult(
                "done",
                "PDF created")
            }).catch((err: any) => {
              console.warn("got error: ", err)
              //return handleError(err)
            })


        })



      // const res = await chrome.tabs.sendMessage(
      //   chrometab.id || 0,
      //   "getcontent",
      //   {})//,
      // //async (res) => {
      // console.log("getcontent returned result with length", res?.content?.length, chrometab.id)
      // // let html = await contentutils.setbasehref(tabcandidates[0].url || '', res.content)
      // let html = res.content
      // try {
      //   const res2 = await useSnapshotsService().pdfFrom(html)
      //   await useSnapshotsService().savePdf(this.id, chrometab.url || '', res2.data)
      //   return new ExecutionResult<string>(
      //     "done",
      //     "pdf created")
      // } catch (err: any) {
      //   console.warn("got error: ", err)
      // }
      // //})


      return new ExecutionResult("trying to save", "trying to save")
    } else {
      // console.debug(`did not contain wanted url ${this.url}:\n - ${_.join(_.map(tabs, (t: chrome.tabs.tab) => t.url), ',\n')}`)
      return Promise.reject("no candidate found")
    }


  }

}

SavePdfCommand.prototype.toString = function cmdToString() {
  return `SavePdfCommand: {id=${this.id}, url=${this.url}}`;
};
