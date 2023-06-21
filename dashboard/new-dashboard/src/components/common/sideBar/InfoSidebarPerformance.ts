import { CallbackDataParams, OptionDataValue } from "echarts/types/src/util/types"
import { computed, Ref } from "vue"
import { Accident, Description, getDescriptionFromMetaDb } from "../../../util/meta"
import { ValueUnit } from "../chart"
import { durationAxisPointerFormatter, nsToMs, timeFormatWithoutSeconds } from "../formatter"
import { buildUrl, DataSeries, InfoData } from "./InfoSidebar"

export interface InfoDataPerformance extends DataSeries, InfoData {
  accidents: Ref<Accident[] | undefined> | undefined
  description: Ref<Description | null>
}

export function getInfoDataFrom(params: CallbackDataParams, valueUnit: ValueUnit, accidents: Ref<Accident[]> | null): InfoDataPerformance {
  const dataSeries = params.value as OptionDataValue[]
  const dateMs = dataSeries[0] as number
  const value: number = dataSeries[1] as number
  let projectName: string = params.seriesName as string
  let machineName: string | undefined
  let metricName: string | undefined
  let buildId: number | undefined
  let installerId: number | undefined
  let buildVersion: number | undefined
  let buildNum1: number | undefined
  let buildNum2: number | undefined
  let type: ValueUnit | undefined = valueUnit
  let buildNumber: string | undefined
  let accidentBuild: string | undefined
  //dev fleet builds
  if (dataSeries.length == 5) {
    machineName = dataSeries[2] as string
    buildId = dataSeries[3] as number
    projectName = dataSeries[4] as string
  }
  //dev builds intellij
  if (dataSeries.length == 7) {
    metricName = dataSeries[2] as string
    if (dataSeries[3] == "c") {
      type = "counter"
    }
    machineName = dataSeries[4] as string
    buildId = dataSeries[5] as number
    projectName = dataSeries[6] as string
    accidentBuild = buildId.toString()
  }
  //fleet
  if (dataSeries.length == 9) {
    machineName = dataSeries[2] as string
    buildId = dataSeries[3] as number
    projectName = dataSeries[4] as string
    installerId = dataSeries[5] as number
    buildVersion = dataSeries[6] as number
    buildNum1 = dataSeries[7] as number
    buildNum2 = dataSeries[8] as number
  }
  //jbr
  if (dataSeries.length == 8) {
    metricName = dataSeries[2] as string
    if (dataSeries[3] == "c") {
      type = "counter"
    }
    machineName = dataSeries[4] as string
    buildId = dataSeries[5] as number
    projectName = dataSeries[6] as string
    buildNumber = dataSeries[7] as string
  }
  if (dataSeries.length == 11) {
    metricName = dataSeries[2] as string
    if (dataSeries[3] == "c") {
      type = "counter"
    }
    machineName = dataSeries[4] as string
    buildId = dataSeries[5] as number
    projectName = dataSeries[6] as string
    installerId = dataSeries[7] as number
    buildVersion = dataSeries[8] as number
    buildNum1 = dataSeries[9] as number
    buildNum2 = dataSeries[10] as number
    accidentBuild = `${buildVersion}.${buildNum1}`
  }

  const fullBuildId = buildVersion == undefined ? buildNumber : `${buildVersion}.${buildNum1}${buildNum2 == 0 ? "" : `.${buildNum2}`}`
  const changesUrl = installerId == undefined ? `${buildUrl(buildId as number)}&tab=changes` : `${buildUrl(installerId)}&tab=changes`
  const artifactsUrl = `${buildUrl(buildId as number)}&tab=artifacts`
  const installerUrl = installerId == undefined ? undefined : `${buildUrl(installerId)}&tab=artifacts`

  let showValue = value.toString()
  if (type != "counter") {
    showValue = durationAxisPointerFormatter(valueUnit == "ns" ? nsToMs(value) : value)
  }

  const filteredAccidents = computed(() => {
    console.log(accidents?.value)
    return accidents?.value.filter((accident: Accident) => accident.affectedTest == projectName && accident.buildNumber == accidentBuild)
  })

  const description = getDescriptionFromMetaDb(projectName, "master")

  return {
    build: fullBuildId,
    artifactsUrl,
    changesUrl,
    installerUrl,
    color: params.color as string,
    date: timeFormatWithoutSeconds.format(dateMs),
    value: showValue,
    machineName: machineName as string,
    projectName,
    title: "Details",
    installerId,
    accidents: filteredAccidents,
    buildId: buildId as number,
    description,
    metricName,
  }
}