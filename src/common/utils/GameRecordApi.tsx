/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

export interface GameRecord {
    [key:string]: string;
    rank: string;
    name: string;
    time: string;
    date: string;
  }

export default class GameRecordApi {
    private static maxRecords:number = 8;

  private static keyName(difficulty: string): string{
    return `mine3d_${difficulty}`;
  };

  public static async saveRecord(difficulty: string, user: string, time: number) {
    this.loadRecords(difficulty).then((recordsData: GameRecord[]) => {;
      const newRecord: GameRecord = {
          rank: "0",
          name: user,
          time: time.toString(),
          date: this.formatDateISO(),
      };

      if(recordsData === undefined || recordsData.length === 0){
          recordsData = [];
          recordsData.push(newRecord);
      }
      else{
          recordsData.push(newRecord);
          recordsData.sort((a: GameRecord, b: GameRecord) => {return (Number(a.time) - Number(b.time))});
          recordsData.forEach((val, index) => {
              val.rank = (index + 1).toString();
          });

          if(recordsData.length > this.maxRecords)
              recordsData.pop();
      }

      /*
      localStorage.setItem(this.keyName(difficulty), JSON.stringify(recordsData));
      */
      fetch(`${process.env.REACT_APP_IMJS_AUTH_CLIENT_URI}api/data?difficulty=${difficulty}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordsData, null, 2)
      })
        .then(res => res.json())
        .then(data => console.log(data));
    });
  }

      /*
    const recordsData: GameRecord[] = [
        { rank: '1', name: 'WenChun', time: '5' },
        { rank: '2', name: 'WenChun', time: '10' },
        { rank: '3', name: 'WenChun', time: '12' },
        { rank: '4', name: 'WenChun', time: '18' },
      ];
    */

    public static loadRecords(difficulty: string): Promise<GameRecord[]> {

   /*
    const keyName = this.keyName(difficulty);
    let recordsStr = localStorage.getItem(keyName);
    if(recordsStr === undefined || recordsStr === null || recordsStr === ''){
        return [] as GameRecord[];
    }

    let records: GameRecord[] = JSON.parse(recordsStr as string);
    */
    return fetch(`${process.env.REACT_APP_IMJS_AUTH_CLIENT_URI}api/data?difficulty=${difficulty}`)
        .then(res => res.json())
        .then((records: GameRecord[]) => {
            records.sort((a: GameRecord, b: GameRecord) => Number(a.time) - Number(b.time));
            records.forEach((val, index) => {
                val.rank = (index + 1).toString();
            });
            return records;
        })
        .catch(error => {
            console.error('Error loading records:', error);
            return [];
        });
  }

  private static formatDateISO = () => {
    const currentDate = new Date();
    // Convert the date to ISO string
    const isoString = currentDate.toISOString();
    // Split at the "T" character to get the date part
    const formattedDate = isoString.split("T")[0];
    return formattedDate;
};
}
