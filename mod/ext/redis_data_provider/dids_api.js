/**
 * @author Pedro Sanders
 * @since v1
 */
import DataSource from 'ext/redis_data_provider/ds'
import DSUtil from 'data_provider/utils'
import { Status } from 'data_provider/status'
import isEmpty from 'utils/obj_util'

export default class DIDsAPI {

    constructor() {
        this.ds = new DataSource()
    }

    createFromJSON(jsonObj) {
        try {
            if(this.didExist(jsonObj.spec.location.telUrl)) {
                return {
                    status: Status.CONFLICT,
                    message: Status.message[Status.CONFLICT].value,
                }
            }
            return this.ds.insert(jsonObj)
        } catch(e) {
            e.printStackTrace()
            return {
                status: Status.BAD_REQUEST,
                message: Status.message[Status.BAD_REQUEST].value,
                result: e.getMessage()
            }
        }
    }

    updateFromJSON(jsonObj) {
        try {
            if(!this.didExist(jsonObj.spec.location.telUrl)) {
                return {
                    status: Status.CONFLICT,
                    message: Status.message[Status.CONFLICT].value,
                }
            }

            return this.ds.update(jsonObj)
        } catch(e) {
            return {
                status: Status.BAD_REQUEST,
                message: Status.message[Status.BAD_REQUEST].value,
                result: e.getMessage()
            }
        }
    }

    getDIDs(filter) {
        return this.ds.withCollection('dids').find(filter)
    }

    getDID(ref) {
        const response = this.getDIDs()
        let did

        response.result.forEach(obj => {
            if (obj.metadata.ref == ref) {
                did = obj
            }
        })

        if (!isEmpty(did)) {
            return {
                status: Status.OK,
                message: Status.message[Status.OK].value,
                result: did
            }
        }

        return {
            status: Status.NOT_FOUND,
            message: Status.message[Status.NOT_FOUND].value
        }
    }

    /**
     * note: telUrl maybe a string in form of 'tel:${number}' or
     * a TelURL Object.
     */
    getDIDByTelUrl(telUrl) {
        const response = this.getDIDs()
        let did
        let url

        if (telUrl instanceof Packages.javax.sip.address.TelURL) {
            url = 'tel:' + telUrl.getPhoneNumber()
        } else {
            url = telUrl
        }

        response.result.forEach(obj => {
            if (obj.spec.location.telUrl == url) {
                did = obj
            }
        })

        if (!isEmpty(did)) {
            return {
                status: Status.OK,
                message: Status.message[Status.OK].value,
                result: did
            }
        }

        return {
            status: Status.NOT_FOUND,
            message: Status.message[Status.NOT_FOUND].value
        }
    }

    didExist(telUrl) {
        const response = this.getDIDByTelUrl(telUrl)
        if (response.status == Status.OK) return true
        return false
    }

    deleteDID(ref) {
        try {
            return this.ds.withCollection('dids').remove(ref)
        } catch(e) {
            return {
                status: Status.BAD_REQUEST,
                message: Status.message[Status.BAD_REQUEST].value,
                result: e.getMessage()
            }
        }
    }

}
