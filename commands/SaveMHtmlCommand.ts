import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import _ from "lodash";
import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";

export class SaveMHtmlCommand implements Command<string> {

  constructor(public id: string, public url: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {

    return chrome.tabs.query({currentWindow: true})
      .then((tabs: chrome.tabs.Tab[]) => {
        const tabCandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === this.url)
        if (tabCandidates.length > 0) {
          const captureDetails = {tabId: tabCandidates[0].id || 0}
          console.log("about to capture", captureDetails)
          chrome.pageCapture.saveAsMHTML(captureDetails, async (html: Blob | undefined) => {
            //console.log("blob", html)
            if (html) { // && this.tab) {
              const mhtmlId = await useSnapshotsStore().saveMHtml(this.id, this.url || '', html)
              return Promise.resolve(mhtmlId)
            }
            return Promise.reject("no html found")
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

SaveMHtmlCommand.prototype.toString = function cmdToString() {
  return `SaveMHtmlCommand: {id=${this.id}, url=${this.url}}`;
};
