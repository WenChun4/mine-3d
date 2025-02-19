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
              <Text variant='leading' className='tab'>This is a 3D version of Minesweeper. You can visit the <a href='https://minesweeper.online/' target="_blank">Minesweeper</a> to recall the classic 2D mine sweeper game.</Text>
              <p/>
            </Flex>
            <Divider />
            <div id='row1' className='subcontainer clearfix:after'>
              <div id='div1' className='left'>
                <img src={help1} alt='help1 image' />
                <Text variant='body'>Left click on a box to explore</Text>
              </div>
              <div id='div2' className='right'>
                <img src={help2} alt='help2 image' />
                <Text variant='body'>Number 2 means 2 mines in the boxes around it, mark a mine with right click</Text>
              </div>
            </div>
            <Divider />
            <div id='row2' className='subcontainer clearfix:after'>
              <div id='div3' className='left'>
                <img src={help3} alt='help3 image' />
                <Text variant='body'>If you click on a mine by mistake, game over</Text>
              </div>
              <div id='div4' className='right'>
                <img src={help4} alt='help4 image' />
                <Text variant='body'>All mines are correctly marked, game win</Text>
              </div>
            </div>     
            <Divider />
            <p/>
            <Flex flexDirection='column' alignItems='start' gap='10px'>
              <Text variant='leading'>Source code repository:</Text>
              <Text variant='leading' className='tab'>Github repo: <a href='https://github.com/WenChun4/mine-3d' target="_blank">mine-3d</a>.</Text>
              <Text variant='leading'>Referenced resources:</Text>
              <Text variant='leading' className='tab'>Generate simple 3d geometry: <a href='https://www.itwinjs.org/sandboxes/iTwinPlatform/Simple%203d/' target="_blank">Simple 3d</a>.</Text>
              <Text variant='leading' className='tab'>Generate advanced 3d geometry: <a href='https://www.itwinjs.org/sandboxes/iTwinPlatform/Advanced%203d/' target="_blank">Advanced 3d</a>.</Text>
              <Text variant='leading' className='tab'>Translate 2d geometry: <a href='https://www.itwinjs.org/sandboxes/iTwinPlatform/2d%20Transformations/' target="_blank">2d Transformations</a>.</Text>
              <Text variant='leading' className='tab'>Fire Particle Effect: <a href='https://www.itwinjs.org/sandboxes/iTwinPlatform/Fire%20Particle%20Effect/' target="_blank">Fire Particle Effect</a>.</Text>
              <Text variant='leading' className='tab'>How to implement a web backend using Express: <a href='https://chatgpt.com/' target="_blank">ChatGPT</a>.</Text>
              <Text variant='leading' className='tab'>How to deploy react SPA with Docker: <a href='https://chatgpt.com/' target="_blank">ChatGPT</a>.</Text>
              <Text variant='leading' className='tab'>How to host a React site: <a href='https://chatgpt.com/' target="_blank">ChatGPT</a>.</Text>
              <p/>
            </Flex>    
        </ModalContent>
      </Modal>
    </>
  );
}
