import React, { Component } from 'react'
import NetlifyAPI from 'netlify'
import timeAgo from 'time-ago'
import { csrfToken, parseHash, removeHash } from './utils/auth'
import {
  sortByDate,
  sortByPublishDate,
  sortByName,
  sortByFunctions,
  sortByRepo,
  matchText
} from './utils/sort'
import ForkMe from './components/ForkMe'
import loginButton from './assets/netlify-login-button.svg'
import './App.css'
import DeployTimeline from './DeployTimeline'

// import stub from './stub'

export default class App extends Component {
  constructor(props, context) {
    super(props, context)
    const session = JSON.parse(localStorage.getItem('user') || '{}')
    const response = parseHash(window.location.hash)
    /* Clear hash */
    removeHash()

    /* Protect against csrf (cross site request forgery https://bit.ly/1V1AvZD) */
    if (response.token && !localStorage.getItem(response.csrf)) {
      alert('Token invalid. Please try to login again')
      return
    }

    /* Clean up csrfToken */
    localStorage.removeItem(response.csrf)

    const user = response.csrf ? response : session

    const sites = JSON.parse(localStorage.getItem('sites-cache') || '[]')

    /* Set initial app state */
    this.state = {
      user,
      sites,
      filterText: '',
      loading: false,
      sortBy: 'published_at',
      sortOrder: 'desc',
      selectedSite: null,
    }
  }
  async componentDidMount() {
    const { user } = this.state
    if (!user.token) return

    /* Set request loading state */
    this.setState({
      loading: true
    })

    /* Fetch sites from netlify API */
    const client = new NetlifyAPI(window.atob(user.token))
    localStorage.setItem('user', JSON.stringify(user));
    const sites = [];
    let page = 0;
    const page_size = 100;
    let results = [];
    do {
      results = await client.listSites({
        page,
        per_page: page_size,
        filter: 'all'
      })
      page = page + 1
      sites.push(...results)
    } while (results.length === page_size)

    localStorage.setItem('sites-cache', JSON.stringify(sites))

    /* Set sites and turn off loading state */
    this.setState({
      sites: sites,
      loading: false
    })
  }
  handleAuth = e => {
    e.preventDefault()
    const state = csrfToken()
    const { location, localStorage } = window
    /* Set csrf token */
    localStorage.setItem(state, 'true')
    /* Do redirect */
    const redirectTo = `${location.origin}${location.pathname}`
    window.location.href = `/.netlify/functions/auth-start?url=${redirectTo}&csrf=${state}`
  }
  handleLogout = e => {
    e.preventDefault()
    window.location.href = `/`
  }
  handleFilterInput = e => {
    this.setState({
      filterText: e.target.value
    })
  }
  handleSort = e => {
    const { sortOrder } = this.state
    if (e.target && e.target.dataset) {
      this.setState({
        sortBy: e.target.dataset.sort,
        // invert sort order
        sortOrder: sortOrder === 'desc' ? 'asc' : 'desc'
      })
    }
  }

  clearSelectedSite = e => {
    this.setState({
      selectedSite: null
    })
  }

  renderSiteList = () => {
    const { sites, filterText, loading, sortBy, sortOrder } = this.state

    if (loading && sites.length === 0) {
      return <div>Loading sites...</div>
    }

    let order
    if (sortBy === 'published_at') {
      order = sortByPublishDate(sortOrder)
    } else if (sortBy === 'name' || sortBy === 'account_name') {
      order = sortByName(sortBy, sortOrder)
    } else if (sortBy === 'updated_at' || sortBy === 'created_at') {
      order = sortByDate(sortBy, sortOrder)
    } else if (sortBy === 'functions') {
      order = sortByFunctions(sortOrder)
    } else if (sortBy === 'repo') {
      order = sortByRepo(sortOrder)
    }

    const sortedSites = sites.sort(order)

    let matchingSites = sortedSites.filter(site => {
      // No search query. Show all
      if (!filterText) {
        return true
      }

      const { name, site_id, ssl_url, build_settings } = site
      if (
        matchText(filterText, name) ||
        matchText(filterText, site_id) ||
        matchText(filterText, ssl_url)
      ) {
        return true
      }

      // Matches repo url
      if (
        build_settings &&
        build_settings.repo_url &&
        matchText(filterText, build_settings.repo_url)
      ) {
        return true
      }

      // no match!
      return false
    })
    .map((site, i) => {
      const {
        name,
        account_name,
        ssl_url,
        screenshot_url,
        created_at
      } = site
      const published_deploy = site.published_deploy || {}
      const functions = published_deploy.available_functions || []
      const functionsNames = functions.map(func => func.n).join(', ')
      const build_settings = site.build_settings || {}
      const { repo_url = '' } = build_settings
      const time = published_deploy.published_at ? timeAgo.ago(new Date(published_deploy.published_at).getTime()) : 'NA'
      const createdAt = created_at ? timeAgo.ago(new Date(created_at).getTime()) : 'NA'
      return (
        <div className='site-wrapper' key={i} onClick={() => this.setState({selectedSite: site})}>
          <div className='site-screenshot'>
            <img src={screenshot_url} alt='' />
          </div>
          <div className='site-info'>
            <h2>
              {name}
            </h2>
            <div className='site-meta'>
                {ssl_url}
            </div>
          </div>
          <div className='site-team'>
            {account_name}
          </div>
          <div className='site-publish-time'>{time}</div>
          <div className='site-functions'>
            <div title={functionsNames}>
              {functions.length}
            </div>
          </div>
          <div className='site-create-time'>{createdAt}</div>
          <div className='site-repo-link'>
            {repo_url.replace(/^https:\/\//, '')}
          </div>
        </div>
      )
    })

    if (!matchingSites.length) {
      matchingSites = (
        <div>
          <h3>
            No '{filterText}' examples found. Clear your search and try again.
          </h3>
        </div>
      )
    }
    return matchingSites
  }
  render() {
    const { selectedSite, user } = this.state

    /* Not logged in. Show login button */
    if (user && !user.token) {
      return (
        <div className='app'>
          <ForkMe url='https://github.com/netlify-labs/oauth-example' />
          <h1>Netlify Site Search</h1>
          <button onClick={this.handleAuth} >
            <img alt='login to netlify' className='login-button' src={loginButton} />
          </button>
        </div>
      )
    }

    if (selectedSite) {
      return (
        <div>
          <button onClick={this.clearSelectedSite}> Back </button>
          <DeployTimeline user={user} site={selectedSite} />
        </div>
      );
    }

    /* Show admin UI */
    return (
      <div className='app'>
        <ForkMe url='https://github.com/netlify-labs/oauth-example' />
        <h1>
          <span className='title-inner'>
            Hi {user.full_name || 'Friend'}
            <button className='primary-button' onClick={this.handleLogout}>
              Logout
            </button>
          </span>
        </h1>
        <div className='contents'>
          <input
            className='search'
            onChange={this.handleFilterInput}
            placeholder='Search for sites by name, id, url or repo'
          />
          <div className='site-wrapper-header'>
            <div
              className='site-screenshot-header header'
              data-sort='name'
              onClick={this.handleSort}
              title='Click to sort by site name'
            >
              Site Info
            </div>
            <div
              className='site-info header'
              data-sort='name'
              onClick={this.handleSort}
            />
            <div
              className='site-team header'
              data-sort='account_name'
              onClick={this.handleSort}
              title='Click to sort by team name'
            >
              Team
            </div>
            <div
              className='site-publish-time header'
              data-sort='published_at'
              onClick={this.handleSort}
              title='Click to sort by last publish date'
            >
              Last published
            </div>
            <div
              className='site-functions header'
              data-sort='functions'
              onClick={this.handleSort}
              title='Click to sort by number of Functions'
            >
              Functions
            </div>
            <div
              className='site-create-time header'
              data-sort='created_at'
              onClick={this.handleSort}
              title='Click to sort by site creation date'
            >
              Created At
            </div>
            <div
              className='site-repo-link header'
              data-sort='repo'
              onClick={this.handleSort}
              title='Click to sort by repo link'
            >
              Repo
            </div>
          </div>
          {this.renderSiteList()}
        </div>
      </div>
    )
  }
}
