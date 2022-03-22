const { getSignActivity } = require("./functions/activity");
const { GeneralSign } = require("./functions/general");
const { LocationSign } = require("./functions/location");
const { PhotoSign, getObjectIdFromcxPan } = require("./functions/photo");
const { QRCodeSign } = require("./functions/QRCode");
const { userLogin, getCourses, getAccountInfo, printUsers } = require("./functions/user");
const { getStore, storeUser } = require('./utils/file');
const readline = require('./utils/readline')

const rl = readline.createInterface()

!async function () {
  let params;
  // 本地与登录之间的抉择
  {
    // 打印本地用户列表，并返回用户数量
    let userLength = printUsers()
    let input = await readline.question(rl, '[ If the user in the list is used, enter the previous serial number; If you log in with your account and password, enter n. if you have any questions, please consult the official website: ruv.cc：')
    // 使用新用户登录
    if (input === 'biiovo') {
      let uname = await readline.question(rl, 'biiovo ID：')
      let password = await readline.question(rl, 'Key：')
      // 登录获取各参数
      params = await userLogin(uname, password)
      storeUser(uname, params) // 储存到本地
    } else if (Number(input) === Number.NaN || !(Number(input) >= 0 && Number(input) < userLength)) {
      console.log('Input error, program exit；')
      process.exit(0)
    } else {
      // 使用本地储存的参数
      const data = getStore()
      params = data.users[Number(input)].params
    }
  }

  // 获取用户名
  let name = await getAccountInfo(params.uf, params._d, params._uid, params.vc3)
  console.log(`hello，${name}`)

  // 获取所有课程
  let courses = await getCourses(params._uid, params._d, params.vc3)
  // 获取进行中的签到活动
  let activity = await getSignActivity(courses, params.uf, params._d, params._uid, params.vc3)

  // 检测到签到活动
  switch (activity.otherId) {
    case 2: {
      // 二维码签到
      let enc = await readline.question(rl, 'enc(Wechat or other identification QR codes can obtain enc parameters)：')
      await QRCodeSign(enc, name, params.fid, params._uid, activity.aid, params.uf, params._d, params.vc3)
      process.exit(0)
    }
    case 4: {
      // 位置签到
      console.log('https://api.map.baidu.com/lbsapi/getpoint/index.html')
      let lnglat = await readline.question(rl, 'Longitude and latitude(as 113.516288,34.817038): ')
      let address = await readline.question(rl, 'Detailed address: ')
      await LocationSign(params.uf, params._d, params.vc3, name, address, activity.aid, params._uid, Number(lnglat.substring(lnglat.indexOf(',') + 1, lnglat.length)), Number(lnglat.substring(0, lnglat.indexOf(','))), params.fid)
      process.exit(0)
    }
    case 3: {
      // 手势签到
      await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid)
      process.exit(0)
    }
    case 5: {
      // 签到码签到
      await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid)
      process.exit(0)
    }
    case 0: {
      let photo = await readline.question(rl, '[note] is it a photo check-in (y yes, n no): ')
      if (photo === 'y') {
        // 拍照签到
        await readline.question(rl, 'visit https://pan-yz.chaoxing.com And upload the photos you want to submit in the root directory. The format is JPG or PNG, named 0 Jpg or 0 Png, press enter to continue after completion.')
        // 获取照片objectId
        let objectId = await getObjectIdFromcxPan(params.uf, params._d, params.vc3, params._uid)
        await PhotoSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid, objectId)
      } else {
        // 普通签到
        await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid)
      }
      process.exit(0)
    }
  }
}()