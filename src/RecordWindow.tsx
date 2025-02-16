/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import React from "react";
import { Button, Dialog, Table } from "@itwin/itwinui-react";
import { SvgOtherMedal } from "./common/imgs/SvgOtherMedal";
import { SvgSilverMedal } from "./common/imgs/SvgSilverMedal";
import { SvgGoldMedal } from "./common/imgs/SvgGoldMedal";
import { SvgBronzeMedal } from "./common/imgs/SvgBronzeMedal";
import RecordApi, { GameRecord } from "./common/utils/GameRecordApi";
import { SvgGoldMedal2 } from "./common/imgs/SvgGoldMedal2";


type RecordWindowProps = {
    show: boolean;
    difficulty: string;
    setShow: (isShow: boolean) => void;
  };

  const RankingTable = ({ datas }: { datas: GameRecord[] }) => (
    <Table
      columns={[
        { id: 'rank', Header: 'Rank', accessor: 'rank', Cell: RankCell, width: 70 },
        { Header: 'User', accessor: 'name', width: 200 },
        { Header: 'Time (sec)', accessor: 'time', width: 100 },
      ]}
      data={datas}
      emptyTableContent="No records."
      density="extra-condensed"
    />
  );

  const renderRankIcon = (rank: string) => {
    switch (rank) {
      case '1':
        return <SvgGoldMedal2 size = {26} />;
      case '2':
        return <SvgSilverMedal size = {26}/>;
      case '3':
        return <SvgBronzeMedal size = {26}/>;
      default:
        return <SvgOtherMedal size = {26}/>;
    }
  };
  
  const RankCell = ({ row }: { row: any }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {renderRankIcon(row.original.rank)}
    </div>
  );

export default function RecordWindow({ show, difficulty, setShow }: RecordWindowProps) {

  const [recordsData, setRecordsData] = React.useState<GameRecord[]>([]);

  RecordApi.loadRecords(difficulty).then((rds: GameRecord[]) => {
    setRecordsData(rds);
  });

  return (
    <>
    <Dialog
        isOpen={show}
        onClose={() => setShow(false)}
        setFocus={false}
        closeOnEsc
        isDismissible
        portal
    >
        <Dialog.Backdrop />
        <Dialog.Main>
            <Dialog.TitleBar titleText={`High Records (${difficulty})`} />
            <Dialog.Content>
                <RankingTable datas={recordsData} />
            </Dialog.Content>
            <Dialog.ButtonBar>
                <Button styleType='high-visibility' onClick={() => setShow(false)}>Close</Button>
            </Dialog.ButtonBar>
        </Dialog.Main>
    </Dialog>
    </>
);
}
