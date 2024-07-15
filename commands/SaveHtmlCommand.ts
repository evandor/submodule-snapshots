import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import _ from "lodash";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import ContentUtils from "src/core/utils/ContentUtils";

export class SaveHtmlCommand implements Command<string> {

  constructor(public id: string, public url: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    console.log("executing save html command");
    return chrome.tabs.query({currentWindow: true})
      .then((tabs: chrome.tabs.Tab[]) => {
        const tabCandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === this.url)
        if (tabCandidates.length > 0) {
          console.log("about to capture png")

          const chromeTab = tabCandidates[0]

          chrome.tabs.sendMessage(
            chromeTab.id || 0,
            "getContent",
            {},
            async (res) => {
              console.log("getContent returned result with length", res?.content?.length, chromeTab.id)
              let html = await ContentUtils.processHtml(tabCandidates[0].url || '', res.content)
              await useSnapshotsService().saveHTML(this.id, chromeTab.url || '', html)
              return new ExecutionResult(
                "done",
                "Snapshot created")
            })


          return new ExecutionResult("trying to save", "trying to save")
        } else {
          // console.debug(`did not contain wanted url ${this.url}:\n - ${_.join(_.map(tabs, (t: chrome.tabs.Tab) => t.url), ',\n')}`)
          return Promise.reject("no candidate found")
        }
      })
      .catch((err) => {
        return Promise.reject(err)
      })

  }

}

SaveHtmlCommand.prototype.toString = function cmdToString() {
  return `SaveHtmlCommand: {id=${this.id}, url=${this.url}}`;
};
