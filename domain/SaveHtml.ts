import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useNotificationHandler} from "src/core/services/ErrorHandler";
import ContentUtils from "src/core/utils/ContentUtils";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService"
import { WARCRecord, WARCSerializer } from "warcio";

const {handleSuccess, handleError} = useNotificationHandler()

export class SaveHtmlCommand implements Command<any> {

  constructor(
    public chromeTab: chrome.tabs.Tab,
    public saveAsId: string,
    public remark: string | undefined = undefined) {
    // chrome.tabs.query({currentWindow: true})
    //  .then((tabs: chrome.tabs.Tab[]) => {
    //    const candidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === url)
    //    this.chromeTabId = candidates.length > 0 ? candidates[0].id : undefined
    //  })
  }

  async execute(): Promise<ExecutionResult<any>> {
    // if (!usePermissionsStore().hasPermission('pageCapture')) {
    //     handleError("missing permission pageCapture")
    //     return Promise.reject("xxx")
    // }
    console.log("capturing tab", this.chromeTab.id, this.chromeTab.url)

    chrome.tabs.query({currentWindow: true}).then((r: any) => {
      console.log("tabs", r)
    })

    // await chrome.tabs.update(this.chromeTab.id || 0, {active: true})

    chrome.tabs.sendMessage(
      this.chromeTab.id || 0,
      "getContent",
      {},
      (res) => {
        console.log("getContent returned result with length", res?.content?.length, this.chromeTab.id)
        if (res && res.content) {

          // TODO this hides stuff!
          let html = ContentUtils.setBaseHref(this.chromeTab.url || '', res.content)

          useSnapshotsService().saveHTML(this.saveAsId, this.chromeTab.url || '', html, this.remark)

          handleSuccess(
            new ExecutionResult(
              "done",
              "Snapshot created"))
          return
        }
        handleError("content empty...")
      })


    return Promise.resolve(
      new ExecutionResult("dummy", "this should not be called from UI"))

  }

}


SaveHtmlCommand.prototype.toString = function cmdToString() {
  return `SaveHtmlCommand: {saveAsId=${this.saveAsId}, chromeTab=#${this.chromeTab.id}}`;
};
