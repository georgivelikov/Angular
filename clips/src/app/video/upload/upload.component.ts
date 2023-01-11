import {Component, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AngularFireStorage, AngularFireUploadTask} from "@angular/fire/compat/storage";
import { v4 as generateUuid} from "uuid";
import {combineLatest, forkJoin, last, switchMap} from "rxjs";
import {AngularFireAuth} from "@angular/fire/compat/auth";
import firebase from "firebase/compat/app";
import {ClipService} from "../../services/clip.service";
import {Router} from "@angular/router";
import {FfmpegService} from "../../services/ffmpeg.service";

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {

  isDragover = false
  file: File | null = null
  nextStep = false
  showAlert = false
  alertColor = "blue"
  alertMsg = "Please wait! Your clip is being uploaded."
  inSubmission = false
  percentage = 0
  showPercentage = false
  user: firebase.User | null = null
  task?: AngularFireUploadTask
  screenshots: string[] = []
  selectedScreenshot = ''
  screenshotTask?: AngularFireUploadTask

  title = new FormControl("", {
    validators: [
      Validators.required,
      Validators.minLength(3)
    ],
    nonNullable: true
  })

  uploadForm = new FormGroup({
    title: this.title
  })


  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
  ) {
    auth.user.subscribe(user => this.user = user)
    this.ffmpegService.init()
  }

  ngOnDestroy(): void {
    this.task?.cancel()
  }

  async storeFile($event: Event) {
    if(this.ffmpegService.isRunning) {
      return
    }

    this.isDragover = false
    this.file = ($event as DragEvent).dataTransfer ?
      ($event as DragEvent).dataTransfer?.files.item(0) ?? null :
      ($event.target as HTMLInputElement).files?.item(0) ?? null

    if(!this.file || this.file.type !== "video/mp4") {
      return
    }

    this.screenshots = await this.ffmpegService.getScreenshots(this.file)
    this.selectedScreenshot = this.screenshots[0]

    this.title.setValue(
      this.file.name.replace(/\.[^/.]+$/, "")
    )
    this.nextStep = true
  }

  async uploadFile() {
    this.uploadForm.disable()

    this.showAlert = true
    this.alertColor = "blue"
    this.alertMsg = "Please wait! Your clip is being uploaded."
    this.inSubmission = true
    this.showPercentage = true

    const clipFileName = generateUuid()
    const clipPath = `clips/${clipFileName}.mp4`

    const screenshotBlob = await this.ffmpegService.blobFromURL(this.selectedScreenshot)
    const screenshotPath = `screenshots/${clipFileName}.png`

    this.task = this.storage.upload(clipPath, this.file)
    const clipRef = this.storage.ref(clipPath)

    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob)
    const screenshotRef = this.storage.ref(screenshotPath)

    combineLatest([this.task.percentageChanges(), this.screenshotTask.percentageChanges()]).subscribe(progress => {
      const [clipProgress, screenshotProgress] = progress
      if(!clipProgress || !screenshotProgress) {
        return
      }

      this.percentage = (clipProgress + screenshotProgress) as number / 200
    })

    forkJoin([this.task.snapshotChanges(), this.screenshotTask.snapshotChanges()
      ]).pipe(
        switchMap(() => forkJoin([
          clipRef.getDownloadURL(),
          screenshotRef.getDownloadURL()
        ]))).subscribe({
          next: async (url) => {
            const [clipUrl, screenshotUrl] = url
            const clip = {
              userId: this.user?.uid as string,
              displayName: this.user?.displayName as string,
              title: this.title.value,
              fileName: `${clipFileName}.mp4`,
              fileUrl: clipUrl,
              screenshotUrl: screenshotUrl,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              screenshotFileName: `${clipFileName}.png`
            }

            const clipDocRef = await this.clipService.createClip(clip)
            this.alertColor = "green"
            this.alertMsg = "Success! Your clip is now ready to share with the world."
            this.showPercentage = false

            setTimeout(() => {
              this.router.navigate([
                'clip', clipDocRef.id
              ])
            }, 1000)
      },
      error: (err) => {
        this.uploadForm.enable()

        this.alertColor = "red"
        this.alertMsg = "Upload failed! Please try again later."
        this.inSubmission = false
        this.showPercentage = false
      }
    })
  }
}
