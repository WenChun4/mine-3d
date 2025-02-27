/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { Divider, Modal, ModalContent } from "@itwin/itwinui-react";
import { Flex, Text, } from '@itwin/itwinui-react';
import React from "react";
import './HelpWindow.scss';
import help1 from "./common/imgs/help1.png";
import help2 from "./common/imgs/help2.png";
import help3 from "./common/imgs/help3.png";
import help4 from "./common/imgs/help4.png";

type HelpWindowProps = {
    show: boolean;
    setShow: (isShow: boolean) => void;
  };

export default function HelpWindow({show, setShow }: HelpWindowProps) {

  return (
    <>
      <Modal
        isOpen={show}
        title={'Description:'}
        styleType='fullPage'
        onClose={() => setShow(false)}
      >
        <ModalContent>
            <Flex flexDirection='column' alignItems='start' gap='10px'>
              <Text variant='leading' className='tab'>This is a 3D version of Minesweeper. You can visit the <a href='https://minesweeper.online/' rel="noreferrer" target="_blank">Minesweeper</a> to recall the classic 2D mine sweeper game.</Text>
              <p/>
            </Flex>
            <Divider />
            <div id='row1' className='subcontainer clearfix:after'>
              <div id='div1' className='left'>
                <img src={help1} alt='help1 img' />
                <Text variant='body'><b className='highlighttext'>Left click</b> on a box to <b className='highlighttext'>explore</b> the map</Text>
              </div>
              <div id='div2' className='right'>
                <img src={help2} alt='help2 img' />
                <Text variant='body'>Number 2 means <b className='highlighttext'>2 mines</b> in boxes <b className='highlighttext'>around it</b>, you can <b className='highlighttext'>mark</b> a mine with <b className='highlighttext'>right click</b></Text>
              </div>
            </div>
            <Divider />
            <div id='row2' className='subcontainer clearfix:after'>
              <div id='div3' className='left'>
                <img src={help3} alt='help3 img' />
                <Text variant='body'>If you <b className='highlighttext'>click on a mine</b> by mistake, <b className='highlighttext'>game OVER</b></Text>
              </div>
              <div id='div4' className='right'>
                <img src={help4} alt='help4 img' />
                <Text variant='body'>All mines are <b className='highlighttext'>correctly marked</b>, <b className='highlighttext'>game WIN</b></Text>
              </div>
            </div>
            <Divider />
            <p/>
            <Flex flexDirection='column' alignItems='start' gap='10px'>
              <Text variant='leading'><b>Source code repository:</b></Text>
              <Text variant='leading' className='tab'>Github repo: <a href='https://github.com/WenChun4/mine-3d' rel="noreferrer" target="_blank">mine-3d</a>.</Text>
              <p/>
              <Text variant='leading'><b>Referenced resources:</b></Text>
              <Text variant='leading' className='tab'>Generate simple 3d geometry: <a href='https://www.itwinjs.org/sandboxes/iTwinPlatform/Simple%203d/' rel="noreferrer" target="_blank">Simple 3d</a>.</Text>
              <Text variant='leading' className='tab'>Generate advanced 3d geometry: <a href='https://www.itwinjs.org/sandboxes/iTwinPlatform/Advanced%203d/' rel="noreferrer" target="_blank">Advanced 3d</a>.</Text>
              <Text variant='leading' className='tab'>Translate 2d geometry: <a href='https://www.itwinjs.org/sandboxes/iTwinPlatform/2d%20Transformations/' rel="noreferrer" target="_blank">2d Transformations</a>.</Text>
              <Text variant='leading' className='tab'>Fire Particle Effect: <a href='https://www.itwinjs.org/sandboxes/iTwinPlatform/Fire%20Particle%20Effect/' rel="noreferrer" target="_blank">Fire Particle Effect</a>.</Text>
              <Text variant='leading' className='tab'>Background Colors example: <a href='https://www.itwinjs.org/sandboxes/iTwinPlatform/Background-Colors/' rel="noreferrer" target="_blank">Background Colors</a>.</Text>
              <Text variant='leading' className='tab'>iTwin UI Resources: <a href='https://itwinui.bentley.com/docs' rel="noreferrer" target="_blank">Document</a>.</Text>
              <Text variant='leading' className='tab'>How to implement a web backend using Express: <a href='https://chatgpt.com/' rel="noreferrer" target="_blank">ChatGPT</a>.</Text>
              <Text variant='leading' className='tab'>How to deploy react SPA to Docker: <a href='https://chatgpt.com/' rel="noreferrer" target="_blank">ChatGPT</a>.</Text>
              <Text variant='leading' className='tab'>How to use public resources to host a React site: <a href='https://chatgpt.com/' rel="noreferrer" target="_blank">ChatGPT</a>.</Text>
              <p/>
            </Flex>    
        </ModalContent>
      </Modal>
    </>
  );
}
