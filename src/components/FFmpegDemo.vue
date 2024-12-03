<template>
  <div class="gif-module">
    <div class="left-module">
      <a-card title="gif生成参数填写">
        <a-spin tip="基础库加载中..." :spinning="paramsFormLoading">
          <div class="form-content">
            <a-form :model="formData" ref="formRef" name="basic" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-form-item label="上传的视频文件(.mp4)" name="file" :rules="[{ required: true, message: '请上传视频文件' }]">
                <a-input v-model:value="formData.file" type="file" @change="handleFileUpload" accept="video/*"
                  style="border:0" />
              </a-form-item>
              <a-form-item label="gif图开始时间" name="gifStartTime" :rules="[{ required: true, message: '请输入gif图开始时间' }]">
                <div style="display: flex;justify-content: left;align-items: baseline;">
                  <a-input placeholder="请输入gif图开始时间" v-model:value="formData.gifStartTime"
                    style="width:45%;margin-right: 24px;" />
                  <div style="color: #333">填写示例(时分秒)：00:00:00</div>
                </div>
              </a-form-item>
              <a-form-item label="gif图结束时间" name="gifEndTime" :rules="[{ required: true, message: '请输入gif图结束时间' }]">
                <div style="display: flex;justify-content: left;align-items: baseline;">
                  <a-input placeholder="请输入gif图结束时间" v-model:value="formData.gifEndTime"
                    style="width:45%;margin-right: 24px;" />
                  <div style="color: #333">填写示例：00:00:05 或者 5</div>
                </div>
              </a-form-item>
              <a-form-item label="gif图宽度尺寸" name="gifWidth" :rules="[{ required: true, message: '请输入gif宽度尺寸' }]">
                <div style="display: flex;justify-content: left;align-items: baseline;">
                  <a-input placeholder="请输入gif宽度尺寸" v-model:value="formData.gifWidth"
                    style="width:45%;margin-right: 24px;" />
                  <div style="color: #333">填写示例：375/720/750/1080</div>
                </div>
              </a-form-item>
              <a-form-item label="fps(每秒多少帧)" name="fps" :rules="[{ required: true, message: '请输入fps值' }]">
                <div style="display: flex;justify-content: left;align-items: baseline;">
                  <a-input-number :min="1" :max="30" :precision="0" :controls="false" placeholder="请输入fps(每秒多少帧)"
                    v-model:value="formData.fps" style="width:45%;margin-right: 24px;" />
                  <div style="color: #333">填写示例：5/8/10/12</div>
                </div>
              </a-form-item>
              <a-form-item label="操作区" :wrapper-col="{ offset: 0, span: 1 }">
                <a-button type="primary" @click="toApi" :loading="loading">转换为gif图</a-button>
              </a-form-item>
            </a-form>
            <div class="process-text">{{ processTxt }}</div>
          </div>
        </a-spin>
        <div class="tips">
        建议：
        gif 图时长 为1 ～ 5秒；
        gif 宽度 375；
        fps 8~10帧 ；
      </div>
      </a-card>
    
    </div>
    <div class="right-module">
      <a-card title="生成的gif图" style="height: 100%" >
        <template v-if="gifImg" #extra>
          <a-button :loading="downloadBtnLoading" type="primary" @click="downloadGif">下载保存</a-button>
        </template>
        <a-spin tip="gif图片生成中..." :spinning="loading">
        <div class="git-content">
          <a-image :src="gifImg"></a-image>
        </div>
        </a-spin>
      </a-card>
    </div>
  </div>
 
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'

const gifImg = ref('')
const formData = reactive({
  file: null,
  gifStartTime: '00:00:00', // 开始时间
  gifEndTime: '5', // 结束时间
  gifWidth: '375', // 宽度规格
  fps: '10' // 帧率
})


const videoFile = ref('')
function handleFileUpload(event: any) {
  videoFile.value = event.target.files[0];
  gifImg.value = ''
}


const loading = ref(false)
const processTxt = ref('')
const paramsFormLoading = ref(false)

const formRef = ref()
// 调用electron api进行生成
async function toApi() {
  // const buffer = await ffmpeg.writeFile('input.mp4', (await fetchFile(videoFile.value)).slice());
  // const formDatas = new FormData();
  // formDatas.append('video', videoFile.value); // 上传的视频文件
  // formDatas.append('startTime', formData.gifStartTime);  // 可选：GIF 开始时间（秒）
  // formDatas.append('endTime', formData.gifEndTime);   // 可选：GIF 结束时间（秒）
  // formDatas.append('width', formData.gifWidth);    // 可选：GIF 宽度
  // formDatas.append('fps', formData.fps);       // 可选：GIF 帧率
  await formRef.value.validateFields()
  if (!videoFile.value) return message.warning('请先上传视频文件');

  loading.value = true
  // 使用 FileReader 读取文件内容
  const reader = new FileReader();
  reader.onloadend = async () => {
    const fileData = reader.result; // ArrayBuffer 数据
    try {
      // 调用主进程的事件，并传递文件名和数据
      // @ts-ignore
      const filePath = await window.electron.saveFile({
        // @ts-ignore
        name: videoFile.value.name,
        // @ts-ignore
        data: Array.from(new Uint8Array(fileData)), // 转换为可序列化的数组
      });
      console.log('File saved at: 保存文件成功！', filePath);

      const formDatas = {
        startTime: formData.gifStartTime,  // 示例：传递开始时间
        endTime: formData.gifEndTime,    // 示例：传递结束时间
        width: formData.gifWidth,    // 示例：传递宽度
        fps: formData.fps       // 示例：传递帧率
      }

      // @ts-ignore
      const gifBuffer = await window.electron.generateGif(formDatas);
      const blob = new Blob([gifBuffer], { type: 'image/gif' });
      gifImg.value = URL.createObjectURL(blob);
    } catch (error) {
      console.error('报错了！:', error);
    } finally {
      loading.value = false
    }
  };
  // @ts-ignore
  reader.readAsArrayBuffer(videoFile.value); // 读取文件为 ArrayBuffer
}

// 下载gif图
const downloadBtnLoading = ref(false)
function downloadGif() {
  try {
    downloadBtnLoading.value = true
    const link = document.createElement('a');
    link.href = gifImg.value
    link.download = 'image.gif'
    link.click()
  } finally {
    downloadBtnLoading.value = false
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 24px;
}

.gif-module {
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  width: 100%;
}

.left-module {
  width: 50%;
  padding: 0 16px;
}

.tips {
  text-align: left;
  margin-left: 16px;
  margin-top: 24px;
  color:tomato
}

.right-module {
  width: 50%;
  padding: 0 16px;
}

.git-content {
  min-height: 360px;
}

.process-text {
  padding-top: 24px;
  margin-top: 24px;
}
</style>
