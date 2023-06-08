import React from "react";
import { createRoot } from "react-dom/client";
import { message, FloatButton } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { getConfig, chromeStorageGet, chromeStorageSet, sendMessageCanRetry } from "@components/Utils"
import Flow from '@components/flow/index'
import Chatbot from "@src/components/ChatbotMain";

import { parseCombo2ControlEvent } from '@components/flow/Workflow'

const menuNames = {
  devTooltip: '调试窗口'
}


declare const window: Window &
  typeof globalThis & {
    _brainwave_import: any,
    _brainwave_get_current_node_for_workflow: any,
    _brainwave_get_workflow_data: any,
    _brainwave_save_callback: any,
    _brainwave_save_callback_init: any,
    _brainwave_debug_callback: any
  }

const config = getConfig();


// 保存combo
function saveCombos(combos: any = []) {
  console.log('saveCombos', combos)
  chromeStorageGet(['user']).then((items: any) => {
    let newUser: any = []
    if (items && items.user) {
      newUser = [...items.user]
    }
    for (const n of combos) {
      let isNew = true;
      if (newUser.filter((u: any) => u.id == n.id).length > 0) isNew = false;
      if (isNew) {
        newUser.push(n);
      } else {
        // 替换
        newUser = Array.from(newUser, (u: any) => {
          if (u.id == n.id) {
            u = { ...n }
          }
          return u
        })
      }
      ;
    }
    chromeStorageSet({ 'user': newUser });
    message.info('已保存');
    // sendMessageCanRetry('combo-editor-refresh', {}, console.log)
  });
}




function options() {
  // 用来收集节点的debug输入输出 
  const [debugData, setDebugData]: any = React.useState({});
  const [flowWidth, setFlowWidth] = React.useState('100%');

  const [loadData, setLoadData] = React.useState({});
  const [isNew, setIsNew] = React.useState(true);

  let exportDataToEarth: any;

  chrome.storage.local.onChanged.addListener((changes) => {
    // console.log('changes')
    if (changes['_brainwave_import'] && changes['_brainwave_import'].newValue) {
      // if (window._brainwave_import) window._brainwave_import(changes['_brainwave_import'].newValue)
      const { isNew, data } = changes['_brainwave_import'].newValue;
      if (data) setLoadData(data)
      if (isNew) setIsNew(!!isNew)
      chromeStorageSet({
        '_brainwave_import': {}
      })

    }
  });

  chromeStorageGet('_brainwave_import').then((res: any) => {
    if (res['_brainwave_import']) {
      const { data, isNew } = res['_brainwave_import'];
      // console.log('chromeStorageGet',data, isNew)
      if (!isNew && data) {
        setLoadData(data);
      }
      setIsNew(!!isNew)
      chromeStorageSet({
        '_brainwave_import': {}
      })
      // console.log('_brainwave_import', data)

    }
  })

  const deleteCombos = (id: string) => {
    // console.log('_delete', id)
    chromeStorageGet(['user']).then((items: any) => {
      const oldData = items.user || [];
      const newData = oldData.filter((od: any) => od.id != id);

      // if (type === 'add') newData.push(data);

      if (newData.length > 5) {
        message.info('已达到最大存储数量')
        // message.error('已达到最大存储数量');
      };

      chromeStorageSet({ 'user': newData }).then(() => window.close())
      // .then(() => this._comboEditorRefresh())

    });
  }

  const chatbotCallbacks = (event: any) => {
    const { cmd, data } = event;
    console.log('chatbotCallbacks:', event)
    if (cmd == "debug-combo") {

      sendMessageCanRetry('open-chatbot-panel', {}, console.log)

      if (exportDataToEarth) exportDataToEarth().then((combo: any) => {
        // console.log('exportDataToEarth', combo)
        const event = parseCombo2ControlEvent(combo);
        setIsNew(false);
        setDebugData(event);
      });

    }

    if (cmd === 'send-talk') {
      // console.log('send-talk debugResult', data, debugData);
      if (debugData && debugData.onChange) {
        debugData.onChange({
          id: debugData.id,
          data: {
            debugInput: JSON.stringify(data, null, 2)
          }
        })
      }
    }

    if (cmd === "stop-talk") {
      if (debugData && debugData.onChange) {
        debugData.onChange({
          id: debugData.id,
          data: {
            debugOutput: data
          }
        })
      }

    }

    // if (cmd == 'open-chatbot-panel') {
    //   setFlowWidth('calc(100% - 500px)')
    // } else if (cmd == "close-insight") {
    //   setFlowWidth('100%')
    // }
  }

  return (<div
    style={{
      width: flowWidth, height: '100%'
    }}>
    <Flow
      loadData={loadData}
      debug={{
        callback: (event: any) => {
          sendMessageCanRetry('open-chatbot-panel', {}, console.log)
          console.log('debug-callback-for-parent', event)
          if (event) setTimeout(() => {
            setDebugData(event)
          }, 100)
        },
        open: true
      }}
      isNew={isNew}
      exportData={(e: any) => (exportDataToEarth = e)}
      saveCallback={
        (combo: any) => saveCombos([combo])
      }
      deleteCallback={
        (comboId: any) => deleteCombos(comboId)
      }
    />
    <FloatButton
      type="primary"
      icon={<RobotOutlined />}
      tooltip={<div>{menuNames.devTooltip}</div>}
      onClick={() => {
        sendMessageCanRetry('open-chatbot-panel', {}, console.log)
      }}
    />
    <Chatbot
      className="_agi_ui"
      appName={config.app}
      // 代理器
      agents={false}
      // 阅读模式
      readability={false}
      // 是否全屏
      fullscreen={false}
      // 默认传参
      userInput={{
        prompt: '',
        tag: ''
      }}
      // 默认是否开启
      initIsOpen={false}
      // 初始引擎
      initChatBotType={
        'ChatGPT'
      }
      debug={true}
      debugData={debugData}
      callback={(e: any) => chatbotCallbacks(e)}
    />
  </div>)
}

async function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find page root element");
  const root = createRoot(rootContainer);
  const renderRoot = () => {
    const page = React.createElement(options, {});
    root.render(page);
  };
  renderRoot()
}

init();

