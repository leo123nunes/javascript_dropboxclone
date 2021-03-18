class DropBoxController{
    constructor(){
        this.btnSendFileEl = document.querySelector('#btn-send-file')

        this.inputFileEl = document.querySelector("#files")

        this.snackBarEl = document.querySelector("#react-snackbar-root")

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

                ajax.send(formData)
            }))
        })

        return Promise.all(promises)
    }
}