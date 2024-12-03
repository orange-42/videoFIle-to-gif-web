<template>
  <div class="gif-module">
    <div class="left-module">
      
      <a-card title="gif生成参数填写">
        <a-spin tip="基础库加载中..." :spinning="paramsFormLoading">
          <div class="form-content">
          <a-form :model="formData" ref="formRef" name="basic"
            :label-col="{ span: 8 }"
            :wrapper-col="{ span: 16 }">
            <a-form-item label="上传的视频文件(.mp4)" name="file" :rules="[{required: true, message: '请上传视频文件'}]">
              <a-input v-model:value="formData.file" type="file" @change="handleFileUpload" accept="video/*"  style="border:0"/>
            </a-form-item>
            <a-form-item label="gif图开始时间"  name="gifStartTime"  :rules="[{required: true, message: '请输入gif图开始时间'}]">
              <div style="display: flex;justify-content: left;align-items: baseline;">
                <a-input placeholder="请输入gif图开始时间" v-model:value="formData.gifStartTime" style="width:45%;margin-right: 24px;"/>
                <div style="color: #333">填写示例(时分秒)：00:00:00</div>
              </div>
            </a-form-item>
            <a-form-item label="gif图结束时间" name="gifEndTime" :rules="[{required: true, message: '请输入gif图结束时间'}]">
              <div style="display: flex;justify-content: left;align-items: baseline;">
                <a-input placeholder="请输入gif图结束时间" v-model:value="formData.gifEndTime" style="width:45%;margin-right: 24px;"/>
                <div style="color: #333">填写示例：00:00:05 或者 5</div>
              </div>
            </a-form-item>
            <a-form-item label="gif图宽度尺寸"  name="gifWidth" :rules="[{required: true, message: '请输入gif宽度尺寸'}]">
              <div style="display: flex;justify-content: left;align-items: baseline;">
                <a-input placeholder="请输入gif宽度尺寸" v-model:value="formData.gifWidth" style="width:45%;margin-right: 24px;"/>
                <div style="color: #333">填写示例：320/375/720/1080</div>
              </div>
            </a-form-item>
            <a-form-item label="fps(每秒多少帧)"  name="fps" :rules="[{required: true, message: '请输入fps值'}]">
              <div style="display: flex;justify-content: left;align-items: baseline;">
                <a-input-number :min="1" :max="30" :precision="0" :controls="false" placeholder="请输入fps(每秒多少帧)" v-model:value="formData.fps" style="width:45%;margin-right: 24px;"/>
                <div style="color: #333">填写示例：5/8/10/12</div>
              </div>
            </a-form-item>
            <a-form-item label="操作区" :wrapper-col="{ offset: 0, span: 1 }">
              <!-- <a-button @click="toApi">调接口</a-button>
              <a-button @click="toImg">生成调色板</a-button> -->
              <a-button type="primary" @click="toGif" :loading="loading">转换为gif图</a-button>
            </a-form-item>
          </a-form>
          <div class="process-text">{{ processTxt }}</div>
        </div>
        </a-spin>
      </a-card>
    </div>
    <div class="right-module">
      <a-card title="生成的gif图">
        <template v-if="gifImg" #extra>
          <a-button :loading="downloadBtnLoading" type="primary" @click="downloadGif">下载保存</a-button>
        </template>
        <div class="git-content">
          <a-image :src="gifImg"></a-image>
        </div>
      </a-card>
    </div>
  </div>
  <div style="text-align: left;margin-left: 16px;margin-top: 24px;color:tomato">
    建议：
    gif 图时长 为1 ～ 5秒；
    gif 宽度 375；
    fps 8~10帧 ；
  </div>
  <!-- <video :src="video" controls />
  <br />
  <button @click="transcode">Start</button>
  <p>{{ message }}</p>
  <img :src="gifImg" /> -->
</template>

<script lang="ts">
import { FFmpeg } from '@ffmpeg/ffmpeg'
import type { LogEvent } from '@ffmpeg/ffmpeg/dist/esm/types'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { defineComponent, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'

const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'
const videoURL = 'https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi'

export default defineComponent({
  name: 'App',
  setup() {
    const ffmpeg = new FFmpeg()
    // const message = ref('Click Start to Transcode')
    let video = ref('')
    const gifImg = ref('')
    const formData = reactive({
      file: null,
      gifStartTime: '00:00:00', // 开始时间
      gifEndTime: '5', // 结束时间
      gifWidth: '375', // 宽度规格
      fps: '10' // 帧率
    })
    async function transcode() {
      // message.value = 'Loading ffmpeg-core.js'
      ffmpeg.on('log', ({ message: msg }: LogEvent) => {
        // message.value = msg
        console.log(msg, 'msgss')
      })
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
      })
      // message.value = 'Start transcoding'
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoURL))
      await ffmpeg.exec([
        '-ss', formData.gifStartTime,      // 开始时间
        '-t', formData.gifEndTime,         // 结束时间
        '-i', 'input.mp4',                 // 输入视频
        '-lavfi',
        `fps=${formData.fps},scale=${formData.gifWidth}:-1:flags=lanczos,palettegen`,  // 生成调色板时使用较高质量
        '-y', 'palette.png'                // 输出调色板
      ]);
      // await ffmpeg.exec(['-i', 'test.avi', 'test.gif'])
      // message.value = 'Complete transcoding'
      // const data = await ffmpeg.readFile('test.gif')
      // const gifBlob = new Blob([(data as Uint8Array).buffer], { type: 'image/gif' });
      // const reader = new FileReader();
      // reader.onload = () => {
      // gifImg.value = reader.result as string; // Base64 编码的 GIF 数据
      // };
      // reader.readAsDataURL(gifBlob)
      // video.value = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }))
      // gifImg.value = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'image/gif' }))
    }


    const videoFile = ref('')
    const paletteImg = ref('')
    function handleFileUpload(event: any) {
      videoFile.value = event.target.files[0];
      console.log(videoFile.value, 'videoFile=videoFile')
      gifImg.value = ''
      // gifUrl.value = '';  // 清除之前的 GIF 预览
    }


    const loading = ref(false)
    const processTxt = ref('')
   


    const imgLoading = ref(false)
    async function toImg() {
      try {
        if (!videoFile.value) return message.warning('请先上传视频文件');

        imgLoading.value = true;

        // 监听 FFmpeg 的日志输出
        ffmpeg.on('log', ({ message: msg }) => {
          console.log(msg, 'msg')
          processTxt.value = msg;
        });

        ffmpeg.on('error', (error) => {
          console.error('FFmpeg 错误:', error);
        });

        console.log('开始生成调色板')
        processTxt.value = '开始生成调色板';
        const inputFileName = 'input1.mp4'
        // 写入视频文件到虚拟文件系统
        await ffmpeg.writeFile(inputFileName, (await fetchFile(videoFile.value)).slice());
  
        
        console.log('生成成功！')
      //   stage1DecodeArgs.push(
      //   '-f', 'rawvideo',
      //   '-pix_fmt', 'rgba',
      //   '-video_size', `${width}x${height}`,
      //   '-framerate', String(Math.round(frameCount / 3)),
      // )
      // const options = {"start":0,"end":3,"speed":1,"width":640,"height":-1,"framerate":10,"maxColors":255,"dither":"sierra2_4a","watermarkIndex":-1}
      // const outputFilename = 'output.gif'
      // console.log(stage1DecodeArgs, 'stage1DecodeArgs')
      // await ffmpeg.exec([
      //   ...stage1DecodeArgs,
      //   '-i', stage1Filename,
      //   '-vf', `split[a][b];[a]palettegen=max_colors=${options.maxColors}[pal];[b][pal]paletteuse=dither=${options.dither}`,
      //   '-y', outputFilename
      // ], undefined)
      // const outputData = await ffmpeg.readFile(outputFilename)
      // console.log(outputData, 'outputData=outputDataoutputData')
        await ffmpeg.exec([
          '-ss', formData.gifStartTime,      // 开始时间
          '-t', formData.gifEndTime,         // 结束时间
          '-i', inputFileName,
          '-vf', 'fps=8,scale=375:-1',
          '-y', 'converted.mp4'
        ]);
        console.log('读取视频成功')
        // gifImg.value = URL.createObjectURL(new Blob([(outputData as Uint8Array).buffer], { type: 'image/gif' }));
        // console.log(gifImg.value, 'gifImg=gifImg');
        // 生成调色板
        // ,palettegen=max_colors=128
        // await ffmpeg.exec([
        //  '-ss', formData.gifStartTime,      // 开始时间
        //   '-t', formData.gifEndTime,         // 结束时间
        //   '-i', 'medium.raw',                 // 输入视频
        //   '-y', 'palette123.png'      
        // ]);

        console.log('调色板生成成功');

        // 写入调色板到虚拟文件系统
        // const paletteData = await ffmpeg.readFile('palette123.png');
        // console.log(paletteData, 'paletteData=paletteData')
      } catch (error) {
        console.log('转换失败', error);
        message.error('转换失败，请重试');
      } finally {
        imgLoading.value = false;
      }
    }

    const paramsFormLoading = ref(false)
    async function load() {
      try {
        console.log(ffmpeg, 'ffmpeg')
        paramsFormLoading.value = true
        // 使用 toBlobURL 转换文件资源
        const coreURL = await toBlobURL(`https://dev.fed.mainto.cn/test/ffmpeg-gif/dist/ffmpeg/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`https://dev.fed.mainto.cn/test/ffmpeg-gif/dist/ffmpeg/ffmpeg-core.wasm`, 'application/wasm');
        const workerURL = await toBlobURL(`https://dev.fed.mainto.cn/test/ffmpeg-gif/dist/ffmpeg/ffmpeg-core.worker.js`, 'text/javascript');
        // 加载 FFmpeg
        await ffmpeg.load({
            coreURL,
            wasmURL,
            workerURL
          })
        message.success('基础库加载成功，请开始使用～')
      } catch(e) {
        console.log(e, 'eeeee')
      } finally {
        paramsFormLoading.value = false
      }
    }
    onMounted(load)

    const formRef = ref()
    async function toGif() {
      try {
        console.log(formRef.value, 'formRef')
        await formRef.value.validateFields()
        if (!videoFile.value) return message.warning('请先上传视频文件');

        loading.value = true;

        // 监听 FFmpeg 的日志输出
        ffmpeg.on('log', ({ message: msg }) => {
          console.log(msg, 'msg')
          processTxt.value = msg;
        });

        ffmpeg.on('error', (error) => {
          console.error('FFmpeg 错误:', error);
        });

       

        console.log('开始生成调色板')
        processTxt.value = '开始生成调色板';

      
       

        // await ffmpeg.exec([
        //   '-ss', formData.gifStartTime,      // 开始时间
        //   '-t', formData.gifEndTime,         // 结束时间
        //   '-i', 'input.mp4',                 // 输入视频
        //   '-lavfi',
        //   'fps=10,scale=375:-1:flags=lanczos,palettegen',  // 在生成调色板之前转换为 sRGB
        //   '-y', 'palette.png'                // 输出调色板
        // ])
         // 写入调色板到虚拟文件系统
        //  const paletteData = await ffmpeg.readFile('palette.png');
        // console.log(paletteData, 'paletteData=paletteData')
        // hqdn3d=2.5:2.5:5:5,unsharp=5:5:1.0,

        // console.log('读取视频成功')
        // await ffmpeg.exec([
        //   '-ss', formData.gifStartTime,      // 开始时间
        //   '-t', formData.gifEndTime,         // 结束时间
        //   '-i', 'input.mp4',                 // 输入视频
        //   '-lavfi',
        //   `hqdn3d=1.0:1.0:2.0:2.0,fps=${formData.fps},scale=${formData.gifWidth}:-1:flags=lanczos`,  // 滤镜链：去噪、锐化、帧率、缩放
        //   '-q:v', '10',
        //   'output.gif'                       // 输出文件
        // ]);
        // hqdn3d=1.0:1.0:2.0:2.0,scale=${formData.gifWidth}:-1:flags=lanczos
        // await ffmpeg.exec([
        //   '-ss', formData.gifStartTime,      // 开始时间
        //   '-t', formData.gifEndTime,         // 结束时间
        //   '-i', 'input.mp4',                 // 输入视频
        //   '-lavfi',
        //   `hqdn3d=1.0:1.0:2.0:2.0,fps=${formData.fps},scale=${formData.gifWidth}:-1:flags=lanczos`,  // 滤镜链：去噪、锐化、帧率、缩放
        //   'output.gif'                       // 输出文件
        // ]);



        // todo：// 写入视频文件到虚拟文件系统
        await ffmpeg.writeFile('input.mp4', (await fetchFile(videoFile.value)).slice());
    
        await ffmpeg.exec([
          '-ss', formData.gifStartTime,              // 开始时间
          '-t', formData.gifEndTime,                 // 结束时间
          '-i', 'input.mp4',                         // 输入视频
          '-lavfi',
          `hqdn3d=3.0:3.0:6.0:6.0,fps=${formData.fps},scale=${formData.gifWidth}:-1:flags=spline`,  // 滤镜链：去噪、非局部均值去噪、帧率、缩放
          'output.gif'                               // 输出文件
        ])
        // boxblur=luma_radius=1:chroma_radius=1,gaussian=sigma=1,bilateral=5:0.1:0.1,
        // todo

        // 第一步：生成调色板
        // ,colorspace=all=bt709:iall=bt601
// await ffmpeg.exec([
//   '-ss', formData.gifStartTime,      // 开始时间
//   '-t', formData.gifEndTime,         // 结束时间
//   '-i', 'input.mp4',                 // 输入视频
//   '-lavfi',
//   'fps=10,scale=375:-1:flags=lanczos,palettegen=max_colors=128',  // 设置最大颜色数为128
//   '-y', 'palette.png'                // 输出调色板
// ])

// 读取调色板文件，确保它存在
// const paletteData = await ffmpeg.readFile('palette.png');
// console.log('调色板文件读取成功', paletteData);

// // 第二步：将调色板应用于生成 GIF
// await ffmpeg.exec([
//   '-ss', formData.gifStartTime,      // 开始时间
//   '-t', formData.gifEndTime,         // 结束时间
//   '-i', 'input.mp4',                 // 输入视频
//   '-i', 'palette.png',               // 加载生成的调色板
//   '-lavfi',
//   `hqdn3d=1.0:1.0:2.0:2.0,fps=${formData.fps},scale=${formData.gifWidth}:-1:flags=lanczos,paletteuse`,  // 使用调色板生成 GIF
//   'output.gif'                       // 输出 GIF
// ]);


        processTxt.value = '转换成功！';
        // 读取生成的 GIF 文件
        const gifData = await ffmpeg.readFile('output.gif');

        // 转换为 Blob 并生成 URL
        gifImg.value = URL.createObjectURL(new Blob([(gifData as Uint8Array).buffer], { type: 'image/gif' }));
        console.log(gifImg.value, 'gifImg=gifImg');
        // gifsicle.run({
        //   input: [{
        //       file: new Blob([(gifData as Uint8Array).buffer], { type: 'image/gif' }),
        //       name: "input.gif",
        //   }], 
        //   command: [`-O1 --lossy=60 input.gif --colors 64 --optimize=3 -o /out/out.gif`],
        // })
        // .then((outGifFiles: any) => {
        //   console.log(outGifFiles, '1111outGifFiles1111')
        //   const imageUrl = URL.createObjectURL(outGifFiles[0]);
        //   gifImg.value = imageUrl
        //   console.log(outGifFiles, imageUrl, 'outGifFiles1111');
        //   // [File,File,File ...]
        // })
      } catch (error: any) {
        if(error?.errorFields) return
        console.log('转换失败', error);
        message.error('转换失败，请重试');
      } finally {
        loading.value = false;
      }
    }

    async function toApi() {
     
      // const buffer = await ffmpeg.writeFile('input.mp4', (await fetchFile(videoFile.value)).slice());

     
      // const formDatas = new FormData();
      // formDatas.append('video', videoFile.value); // 上传的视频文件
      // formDatas.append('startTime', formData.gifStartTime);  // 可选：GIF 开始时间（秒）
      // formDatas.append('endTime', formData.gifEndTime);   // 可选：GIF 结束时间（秒）
      // formDatas.append('width', formData.gifWidth);    // 可选：GIF 宽度
      // formDatas.append('fps', formData.fps);       // 可选：GIF 帧率

      loading.value = true
       // 使用 FileReader 读取文件内容
  const reader = new FileReader();
  reader.onloadend = async () => {
    const fileData = reader.result; // ArrayBuffer 数据
    try {
     
      // 调用主进程的事件，并传递文件名和数据
      // @ts-ignore
      console.log(window, window?.electron,  window?.electron?.saveFile, 'window.electron.saveFile')
       // @ts-ignore
      const filePath = await window.electron.saveFile({
        // @ts-ignore
        name: videoFile.value.name,
        // @ts-ignore
        data: Array.from(new Uint8Array(fileData)), // 转换为可序列化的数组
      });
      console.log('File saved at: 保存文件成功！', filePath);

      const formData = {
          saveFilePath: filePath,
         // @ts-ignore
          fileData: Array.from(new Uint8Array(fileData)),
          startTime: 0,  // 示例：传递开始时间
          endTime: 3,    // 示例：传递结束时间
          width: 375,    // 示例：传递宽度
          fps: 10,       // 示例：传递帧率
        };

      console.log(formData, 'formDataformData')
       // @ts-ignore
      console.log(window, window?.electron, window?.electron?.generateGif, 'window.electron.generateGif')
      // @ts-ignore
      const gifBuffer = await window.electron.generateGif(formData);
      console.log(gifBuffer, 'gifBuffer=gifBuffer')
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

       // 在前端将文件保存到临时目录或传递给主进程
      // console.log(JSON.stringify(videoFile.value), videoFile.value, 'JSON.stringify(videoFile.value)')
        // @ts-ignore
      //  const filePath = await window.electron.saveFile(JSON.stringify(videoFile.value), {file: videoFile.value});

      // fetch('http://localhost:3090/generate-gif', {
      //   method: 'POST',
      //   body: formDatas
      // })
      //   .then((response) => response.blob())
      //   .then((gifBlob) => {
         
      //     // 处理生成的 GIF 文件
      //     const gifURL = URL.createObjectURL(gifBlob);
      //     console.log(gifURL, 'gifURL')
      //     // const img = document.createElement('img');
      //     // img.src = gifURL;
      //     // console.log(gifURL, 'gifURL')
      //     gifImg.value = gifURL
      //     // document.body.appendChild(img);  // 将生成的 GIF 显示在页面上
      //   })
      //   .catch((error) => console.error('Error generating GIF:', error))
      //   .finally(()=> {
      //     loading.value = false
      //   })
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


    return {
      formRef,
      toApi,
      downloadGif,
      downloadBtnLoading,
      paramsFormLoading,
      toImg,
      paletteImg,
      formData,
      processTxt,
      loading,
      toGif,
      handleFileUpload,
      gifImg,
      video,
      message,
      transcode
    }
  }
})
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
  width: 100%;
}

.left-module {
  width: 50%;
  padding: 0 16px;
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
