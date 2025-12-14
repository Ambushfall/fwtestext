interface OdgovorGlavnogUpita {
    pib: string
    datumZaduzenjaDo: string
    datumUplateDo: string
    isObveznik: boolean
    upitStanjaSaldoOpstList?: UpitStanjaSaldoOpstList[]
  }
  
  interface UpitStanjaSaldoOpstList {
    upitStanjaSaldoList: UpitStanjaSaldoList[]
    sifraOpstine: string
    nazivOpstine: string
    pozivNaBroj: string
    obveznikIdent: string
    datumUpita: string
    vremeObrade: string
  }
  
  interface UpitStanjaSaldoList {
    racun: string
    racunCeo: string
    racunOpis: string
    saldoDuguje: number
    saldoPotrazuje: number
    kamataZaduzenje: number
    kamataObracunata: number
    kamataNaplacena: number
    saldoGlavnica: number
    saldoKamata: number
    saldoUkupan: number
    /**
     * @deprecated
     */
    listaPromena: ListaPromena[]
  }
  
  interface ListaPromena {
    knjPromSifra: string
    knjPromSifraIp: string
    knjPromSifraZp: string
    knjPromDISSifra: string
    knjPromDISOpis: string
    brojNaloga: string
    disDokument?: any
    datum: string
    prometDuguje: number
    prometPotrazuje: number
    kamataZaduzenje: number
    kamataObracunata: number
    kamataNaplacena: number
    saldoGlavnica: number
    saldoKamata: number
    knjPromOpis: string
    knjPromOpisPu: string
  }
  
  interface BODYObject {
    K: string
    V: string
    C: string
    R: string
    N: string
    I: string
    SF: string
    S: string
    RO: string
  }
  
  interface emmitedObj {
    obj?: BODYObject
    status: boolean
  }
  
  interface BodyParametar {
    datumZaduzenjaDo?: null | string
    datumUplateDo?: null | string
    pib: string
    racun?: any
    detail?: any
  }
  
  interface JSONResp {
    'http://schema.id.rs/claims/mail': string
    'http://schema.id.rs/claims/country': string
    sub: string
    'http://schema.id.rs/claims/aal': string
    'http://schema.id.rs/claims/givenname': string
    'http://schema.id.rs/claims/umcn': string
    'http://schema.id.rs/claims/familyname': string
    'http://schema.id.rs/claims/city': string
    'http://schema.id.rs/claims/ial': string
  }