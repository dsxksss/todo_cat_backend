const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const morgan = require("morgan");
const logger = morgan("tiny");
const cron = require('node-cron');
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

const taskPool = new Map();

app.post("/sendReminders", async (req, res) => {
    try{const { id,receivingEmail, title, description, remindersAt } = req.body;
    if (!id||!receivingEmail || !title || !description || !remindersAt) {
        return res.status(400).send({ message: "设定定时邮件失败,请求缺少必要参数!", status: 400 })
    }

    // 获取当前时间戳
    const currentTime = Date.now();

    const date = new Date(remindersAt);
    if (currentTime < remindersAt) {
        // 创建一个邮件传输对象
        const transporter = nodemailer.createTransport({
            //创建发送邮箱的账户和授权码
            host: "smtp.qq.com",
            secureConnection: true,
            port: 465,
            secure: true,
            auth: {
                user: "ventroar.xyz@qq.com",
                pass: "xpdiofbzlijudfaa"
            }
        });

        const emailFrom = {
            //配置邮箱本体发送内容
            from: "ventroar.xyz@qq.com", //发件者
            to: receivingEmail, //收件者
            subject: title, //邮件标题
            html: description //邮件具体内容,支持纯文本、html格式
        };

        const task = cron.schedule(`${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`, () => {
            // 发送邮件
            transporter.sendMail(emailFrom);
        });

        taskPool.set(id,task);

        // 开启定时任务
        task.start();

        return res.status(200).send({ message: "设定定时邮件成功", status: 200 })
    } else {
        return res.status(400).send({ message: "设定定时邮件失败,定时时间小于当前时间", status: 400 })
    }}catch(err){
        return res.status(404).send({ message: `设定定时邮件失败,意外错误:${err}`, status: 500 })
    }
});

app.delete("/destroyReminders", async (req, res) => {
    try{const { id} = req.body;
    if (!id ) {
        return res.status(400).send({ message: "摧毁定时邮件失败,请求缺少必要参数!", status: 400 })
    }

    if(taskPool.has(id)){
        taskPool.get(id).stop();
        taskPool.delete(id);
        return res.status(200).send({ message: "摧毁定时邮件成功", status: 200 })
    } else {
        return res.status(404).send({ message: "摧毁定时邮件失败,定时任务不存在", status: 404 })
    }}
    catch(err){
        return res.status(404).send({ message: `摧毁定时邮件失败,意外错误:${err}`, status: 500 })
    }
})


const port = process.env.PORT || 80;

async function bootstrap() {
    app.listen(port, () => {
        console.log("启动成功", port);
    });
}

bootstrap();