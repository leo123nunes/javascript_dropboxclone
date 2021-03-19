class DropBoxController{
    constructor(){
        this.btnSendFileEl = document.querySelector('#btn-send-file')
        this.inputFileEl = document.querySelector("#files")
        this.snackBarEl = document.querySelector("#react-snackbar-root")
        this.progressBarEl = this.snackBarEl.querySelector(".mc-progress-bar-fg")
        this.snackBarfileNameEl = this.snackBarEl.querySelector(".filename")
        this.snackBarPercentProgressEl = this.snackBarEl.querySelector(".percent-progress")
        this.snackBarTimeLeft = this.snackBarEl.querySelector(".timeleft")

        this.initEvents()
    }

    initEvents(){
        this.btnSendFileEl.addEventListener('click', event => {
            this.inputFileEl.style.display = "block"
        })

        this.inputFileEl.addEventListener('change', event => {
            this.inputFileEl.style.display = "none"
            this.snackBarEl.style.display = "block"

            this.sendFiles(event.target.files)
        })
    }

    sendFiles(files){
        var promises = []

        var groupedFiles = [...files]

        groupedFiles.forEach(file => {
            promises.push(new Promise((resolve, reject) => {
                var ajax = new XMLHttpRequest()

                ajax.open('POST', '/uploads')

                ajax.onload = event => {
                    try{
                        resolve(JSON.parse(ajax.responseText))
                    }catch(error){
                        reject(error)
                    }
                }

                ajax.error = error => reject(error)

                let formData = new FormData()

                formData.append('input-file', file)

                var startTime = new Date()

                ajax.upload.onprogress = event => {
                    this.calculateProgressBar(event.loaded, event.total)
                    this.changeSnackbarTitle(file.name)
                    this.calculateTimeRemaining(startTime, event.loaded, event.total - event.loaded)
                }

                ajax.upload.onloadend = event => {
                    this.inputFileEl.style.display = "none"
                    this.inputFileEl.value = ""
                    setTimeout(() => {
                        this.snackBarEl.style.display = "none" 
                    }, 2000)
                }

                ajax.send(formData)
            }))
        })

        return Promise.all(promises)
    }

    calculateProgressBar(loaded, total){
        var percent = parseInt((100 * loaded) / total)
        this.progressBarEl.style.width = `${percent}%`
        this.snackBarTimeLeft.innerHTML = `${percent}%`
    }

    changeSnackbarTitle(name){
        this.snackBarfileNameEl.innerHTML = name
    }

    calculateTimeRemaining(startTime, loaded, remaining){
        var timeSpent = new Date() - startTime
        var remainingTime = parseInt((timeSpent * remaining) / loaded)
        this.snackBarPercentProgressEl.innerHTML = this.timeConverter(remainingTime)
    }

    timeConverter(milliseconds){
        var second = parseInt(milliseconds / 1000) > 1 ? parseInt(milliseconds / 1000) : null
        var minute = parseInt(second / 60) > 1 ? parseInt(second / 60) : null
        var hour = parseInt(minute / 60) > 1 ? parseInt(minute / 60) : null

        second = second % 60
        minute = minute % 60
        hour = hour % 24

        if(hour){
            return `remaining time - ${hour} hours, ${minute} minutes, and ${second} seconds.`
        }

        if(minute){
            return `remaining time - ${minute} minutes, and ${second} seconds.`
        }

        if(second){
            return `remaining time - ${second} seconds.`
        }

        return `remaining time - 0 seconds.`
        
    }
}