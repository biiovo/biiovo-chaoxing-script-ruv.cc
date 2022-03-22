const https = require('https')
const { ACTIVELIST } = require("../configs/api")

// 返回签到活动
exports.getSignActivity = async (courses, uf, _d, UID, vc3) => {
  console.log('Checking for valid check-in activities. The waiting time depends on the network. If you have any questions, please contact the official website: ruv.cc')
  let i = null, activity = null
  for (i = 0; i < courses.length; i++) {
    // 循环异步请求
    await new Promise((resolve) => {
      let data = ''
      https.get(ACTIVELIST.URL + `?fid=0&courseId=${courses[i].courseId}&classId=${courses[i].classId}&_=${new Date().getTime()}`, {
        headers: {
          'Cookie': `uf=${uf}; _d=${_d}; UID=${UID}; vc3=${vc3};`,
        }
      }, (res) => {
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          // console.log(data)
          data = JSON.parse(data)
          if (data.data.activeList.length != 0) {
            let otherId = Number(data.data.activeList[0].otherId)
            // 判断是否有效签到活动
            if ((otherId >= 0 && otherId <= 5) && data.data.activeList[0].status == 1) {
              // 活动开始超过一小时则忽略
              if ((new Date().getTime() - data.data.activeList[0].startTime) / 1000 < 7200) {
                console.log(`检测到活动：${data.data.activeList[0].nameOne}`)
                activity = {
                  aid: data.data.activeList[0].id,
                  otherId
                }
                i = NaN // 设为NaN将结束循环，该值说明获取到了活动。
              }
            }
          }
          resolve() // 每结束一个课程的活动判断
        })
      })
    })
  }
  // 若等于length说明是遍历了全部，都没有获得活动
  if (i == courses.length) {
    console.log('No valid check-in activity detected! If you have any questions, please contact the official website: ruv.cc')
    process.exit(0) // 直接退出
  } else {
    return activity
  }
}