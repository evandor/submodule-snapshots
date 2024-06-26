export class Annotation {

  constructor(public id: string,
              public selection: any,
              public text: string | undefined,
              public rect: object,
              public viewport: object,
              public comment: string | undefined) {
  }

}
