'use strict'

const eu = encodeURIComponent
const fetch = require('npm-registry-fetch')
const validate = require('aproba')

// From https://github.com/npm/registry/blob/master/docs/orgs/memberships.md
const cmd = module.exports = {}

class MembershipDetail {}
cmd.set = (org, user, role, opts = {}) => {
  if (
    typeof role === 'object' &&
    Object.keys(opts).length === 0
  ) {
    opts = role
    role = undefined
  }
  return new Promise((resolve, reject) => {
    validate('SSSO|SSZO', [org, user, role, opts])
    user = user.replace(/^@?/, '')
    org = org.replace(/^@?/, '')
    fetch.json(`/-/org/${eu(org)}/user`, {
      ...opts,
      method: 'PUT',
      body: { user, role }
    }).then(resolve, reject)
  }).then(ret => Object.assign(new MembershipDetail(), ret))
}

cmd.rm = (org, user, opts = {}) => {
  return new Promise((resolve, reject) => {
    validate('SSO', [org, user, opts])
    user = user.replace(/^@?/, '')
    org = org.replace(/^@?/, '')
    fetch(`/-/org/${eu(org)}/user`, {
      ...opts,
      method: 'DELETE',
      body: { user },
      ignoreBody: true
    }).then(resolve, reject)
  }).then(() => null)
}

class Roster {}
cmd.ls = (org, opts = {}) => {
  return new Promise((resolve, reject) => {
    cmd.ls.stream(org, opts).then(entries => {
      const obj = {}
      for (const [key, val] of entries) {
        obj[key] = val
      }
      return obj
    }).then(resolve, reject)
  }).then(ret => Object.assign(new Roster(), ret))
}

cmd.ls.stream = (org, opts = {}) => {
  validate('SO', [org, opts])
  org = org.replace(/^@?/, '')
  return fetch.json.stream(`/-/org/${eu(org)}/user`, '*', {
    ...opts,
    mapJSON: (value, [key]) => {
      return [key, value]
    }
  })
}
