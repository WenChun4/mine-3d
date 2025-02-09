/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

export interface GameRecord {
    [key:string]: string;
    rank: string;
    time: string;
  }

export default class GameRecordApi {
    private static maxRecords:number = 4;

  private static keyName(difficulty: string): string{
    return `mine3d_${difficulty}`;
  };

  public static saveRecord(difficulty: string, time: number) {
    let recordsData: GameRecord[] = this.loadRecords(difficulty);
    const newRecord: GameRecord = {
        rank: "0",
        time: time.toString(),
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

    localStorage.setItem(this.keyName(difficulty), JSON.stringify(recordsData));
  }

  public static loadRecords(difficulty: string): GameRecord[] {
    const keyName = this.keyName(difficulty);
    let recordsStr = localStorage.getItem(keyName);
    if(recordsStr === undefined || recordsStr === null || recordsStr === ''){
        return [] as GameRecord[];
    }

    let records: GameRecord[] = JSON.parse(recordsStr as string);

    records.sort((a: GameRecord, b: GameRecord) => {return (Number(a.time) - Number(b.time))});
    records.forEach((val, index) => {
        val.rank = (index + 1).toString();
    });
    return records;
    /*
    const recordsData: GameRecord[] = [
        { rank: '1', time: '5' },
        { rank: '2', time: '10' },
        { rank: '3', time: '12' },
        { rank: '4', time: '18' },
      ];
    */
  }
}
