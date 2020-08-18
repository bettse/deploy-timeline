import React, { Component } from 'react'
import NetlifyAPI from 'netlify'


export default class DeployTimeline extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      deploys: [],
    }
  }

  async componentDidMount() {
    const { site, user } = this.props
    const { site_id } = site

    const client = new NetlifyAPI(window.atob(user.token))
    const deploys = await client.listSiteDeploys({
      site_id,
    })

    this.setState({deploys})
  }

  render() {
    const { site } = this.props
    const { deploys } = this.state
    const { name } = site
    //{id, site_id, plan, ssl_plan, premium, claimed, name, custom_domain, domain_aliases, password, notification_email, url, admin_url, deploy_id, build_id, deploy_url, state, screenshot_url, created_at, updated_at, user_id, error_message, ssl, ssl_url, force_ssl, ssl_status, max_domain_aliases, build_settings, processing_settings, prerender, prerender_headers, deploy_hook, published_deploy, managed_dns, jwt_secret, jwt_roles_path, account_slug, account_name, account_type, capabilities, paid_individual_site_subscription, dns_zone_id, identity_instance_id, use_functions, parent_user_id, automatic_tls_provisioning, disabled, lifecycle_state, id_domain, use_lm, build_image, automatic_tls_provisioning_expired, analytics_instance_id, functions_region, functions_config, plugins}
    //
    return (
      <div>
      <h1>{name}</h1>
      {deploys.map((deploy, i) => {
        const { screenshot_url } = deploy
        return (
          <img key={i} src={screenshot_url} />
        )
      })}
      </div>
    );
  }
}
