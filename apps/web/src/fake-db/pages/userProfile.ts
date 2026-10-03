// Type Imports
import type { ProfileHeaderType, DataType } from '@/types/pages/profileTypes'

type DB = {
  users: DataType
  profileHeader: ProfileHeaderType
}

export const db: DB = {
  users: {
    profile: {
      about: [
        { property: 'profileSectionFullName', value: 'John Doe', icon: 'tabler-user' },
        { property: 'profileSectionStatus', value: 'profileStatusActive', icon: 'tabler-check' },
        { property: 'profileSectionRole', value: 'profileRoleDeveloper', icon: 'tabler-crown' },
        { property: 'profileSectionCountry', value: 'profileCountryVatican', icon: 'tabler-flag' },
        { property: 'profileSectionLanguage', value: 'profileLanguageEnglish', icon: 'tabler-language' }
      ],
      contacts: [
        { property: 'profileSectionContact', value: '(123) 456-7890', icon: 'tabler-phone-call' },
        { property: 'profileSectionSkype', value: 'john.doe', icon: 'tabler-messages' },
        { property: 'profileSectionEmail', value: 'john.doe@example.com', icon: 'tabler-mail' }
      ],
      teams: [
        { property: 'profileRoleBackendDeveloper', value: '(126 Members)' },
        { property: 'profileRoleReactDeveloper', value: '(98 Members)' }
      ],
      overview: [
        { property: 'profileSectionTaskCompiled', value: '13.5k', icon: 'tabler-check' },
        { property: 'profileSectionConnections', value: '897', icon: 'tabler-users' },
        { property: 'profileSectionProjectsCompiled', value: '146', icon: 'tabler-layout-grid' }
      ],
      connections: [
        {
          isFriend: true,
          connections: '45',
          name: 'Cecilia Payne',
          avatar: '/images/avatars/2.png'
        },
        {
          isFriend: false,
          connections: '1.32k',
          name: 'Curtis Fletcher',
          avatar: '/images/avatars/3.png'
        },
        {
          isFriend: false,
          connections: '125',
          name: 'Alice Stone',
          avatar: '/images/avatars/4.png'
        },
        {
          isFriend: true,
          connections: '456',
          name: 'Darrell Barnes',
          avatar: '/images/avatars/5.png'
        },
        {
          isFriend: true,
          connections: '1.2k',
          name: 'Eugenia Moore',
          avatar: '/images/avatars/8.png'
        }
      ],
      teamsTech: [
        {
          members: 72,
          ChipColor: 'error',
          chipText: 'profileChipDeveloper',
          title: 'profileTeamReactDevelopers',
          avatar: '/images/logos/react-bg.png'
        },
        {
          members: 122,
          chipText: 'profileChipSupport',
          ChipColor: 'primary',
          title: 'profileTeamSupport',
          avatar: '/images/icons/support-bg.png'
        },
        {
          members: 7,
          ChipColor: 'info',
          chipText: 'profileChipDesigner',
          title: 'profileTeamUiDesigner',
          avatar: '/images/logos/figma-bg.png'
        },
        {
          members: 289,
          ChipColor: 'error',
          chipText: 'profileChipDeveloper',
          title: 'profileTeamVueDevelopers',
          avatar: '/images/logos/vue-bg.png'
        },
        {
          members: 24,
          chipText: 'profileChipMarketing',
          ChipColor: 'secondary',
          title: 'profileTeamDigitalMarketing',
          avatar: '/images/logos/twitter-bg.png'
        }
      ],
      projectTable: [
        {
          id: 1,
          title: 'profileProjectBGC',
          subtitle: 'profileTechnologyReact',
          leader: 'Eileen',
          avatar: '/images/logos/react-bg.png',
          avatarGroup: [
            '/images/avatars/1.png',
            '/images/avatars/2.png',
            '/images/avatars/3.png',
            '/images/avatars/4.png'
          ],
          status: 78
        },
        {
          id: 2,
          leader: 'Owen',
          title: 'profileProjectFalcon',
          subtitle: 'profileTechnologyFigma',
          avatar: '/images/logos/figma-bg.png',
          avatarGroup: ['/images/avatars/5.png', '/images/avatars/6.png'],
          status: 18
        },
        {
          id: 3,
          title: 'profileProjectDashboard',
          subtitle: 'profileTechnologyVue',
          leader: 'Keith',
          avatar: '/images/logos/vue-bg.png',
          avatarGroup: [
            '/images/avatars/7.png',
            '/images/avatars/8.png',
            '/images/avatars/1.png',
            '/images/avatars/2.png'
          ],
          status: 62
        },
        {
          id: 4,
          title: 'profileProjectFoodista',
          subtitle: 'profileTechnologyXamarin',
          leader: 'Merline',
          avatar: '/images/icons/mobile-bg.png',
          avatarGroup: [
            '/images/avatars/3.png',
            '/images/avatars/4.png',
            '/images/avatars/5.png',
            '/images/avatars/6.png'
          ],
          status: 8
        },
        {
          id: 5,
          leader: 'Harmonia',
          title: 'profileProjectDojo',
          subtitle: 'profileTechnologyPython',
          avatar: '/images/logos/python-bg.png',
          avatarGroup: ['/images/avatars/7.png', '/images/avatars/8.png', '/images/avatars/1.png'],
          status: 36
        },
        {
          id: 6,
          leader: 'Allyson',
          title: 'profileProjectBlockchain',
          subtitle: 'profileTechnologySketch',
          avatar: '/images/logos/sketch-bg.png',
          avatarGroup: [
            '/images/avatars/2.png',
            '/images/avatars/3.png',
            '/images/avatars/4.png',
            '/images/avatars/5.png'
          ],
          status: 92
        },
        {
          id: 7,
          title: 'profileProjectHoffman',
          subtitle: 'profileTechnologyHtml',
          leader: 'Georgie',
          avatar: '/images/logos/html-bg.png',
          avatarGroup: [
            '/images/avatars/6.png',
            '/images/avatars/7.png',
            '/images/avatars/8.png',
            '/images/avatars/1.png'
          ],
          status: 88
        },
        {
          id: 8,
          title: 'profileProjectEcommerce',
          subtitle: 'profileTechnologyReact',
          leader: 'Eileen',
          avatar: '/images/logos/react-bg.png',
          avatarGroup: [
            '/images/avatars/1.png',
            '/images/avatars/2.png',
            '/images/avatars/3.png',
            '/images/avatars/4.png'
          ],
          status: 78
        },
        {
          id: 9,
          leader: 'Owen',
          title: 'profileProjectRetroLogo',
          subtitle: 'profileTechnologyFigma',
          avatar: '/images/logos/figma-bg.png',
          avatarGroup: ['/images/avatars/5.png', '/images/avatars/6.png'],
          status: 18
        },
        {
          id: 10,
          title: 'profileProjectAdminDashboard',
          subtitle: 'profileTechnologyVue',
          leader: 'Keith',
          avatar: '/images/logos/vue-bg.png',
          avatarGroup: [
            '/images/avatars/7.png',
            '/images/avatars/8.png',
            '/images/avatars/1.png',
            '/images/avatars/2.png'
          ],
          status: 62
        }
      ]
    },
    teams: [
      {
        extraMembers: 9,
        title: 'profileTeamReactDevelopers',
        avatar: '/images/logos/react-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/1.png', name: 'Vinnie Mostowy' },
          { avatar: '/images/avatars/2.png', name: 'Allen Rieske' },
          { avatar: '/images/avatars/3.png', name: 'Julee Rossignol' }
        ],
        description: 'profileTeamReactDescription',
        chips: [
          {
            title: 'profileChipReact',
            color: 'primary'
          },
          {
            title: 'profileChipMui',
            color: 'info'
          }
        ]
      },
      {
        extraMembers: 4,
        title: 'profileTeamVueDevTeam',
        avatar: '/images/logos/vue-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/5.png', name: "Kaith D'souza" },
          { avatar: '/images/avatars/6.png', name: 'John Doe' },
          { avatar: '/images/avatars/7.png', name: 'Alan Walker' }
        ],
        description: 'profileTeamVueDescription',
        chips: [
          {
            title: 'profileTeamChipVuejs',
            color: 'success'
          },
          {
            color: 'error',
            title: 'profileChipDeveloper'
          }
        ]
      },
      {
        title: 'profileTeamCreativeDesigners',
        avatar: '/images/logos/xd-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/1.png', name: 'Jimmy Ressula' },
          { avatar: '/images/avatars/2.png', name: 'Kristi Lawker' },
          { avatar: '/images/avatars/3.png', name: 'Danny Paul' }
        ],
        description: 'profileTeamDesignDescription',
        chips: [
          {
            title: 'profileChipSketch',
            color: 'warning'
          },
          {
            title: 'profileChipXd',
            color: 'error'
          }
        ]
      },
      {
        title: 'profileTeamSupport',
        avatar: '/images/icons/support-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/5.png', name: 'Andrew Tye' },
          { avatar: '/images/avatars/6.png', name: 'Rishi Swaat' },
          { avatar: '/images/avatars/7.png', name: 'Rossie Kim' }
        ],
        description: 'profileTeamSupportDescription',
        chips: [
          {
            title: 'profileChipZendesk',
            color: 'info'
          }
        ]
      },
      {
        extraMembers: 7,
        title: 'profileTeamDigitalMarketing',
        avatar: '/images/icons/social-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/1.png', name: 'Kim Merchent' },
          { avatar: '/images/avatars/2.png', name: "Sam D'souza" },
          { avatar: '/images/avatars/3.png', name: 'Nurvi Karlos' }
        ],
        description: 'profileTeamMarketingDescription',
        chips: [
          {
            title: 'profileChipTwitter',
            color: 'primary'
          },
          {
            color: 'success',
            title: 'profileChipEmail'
          }
        ]
      },
      {
        extraMembers: 2,
        title: 'profileTeamEvent',
        avatar: '/images/logos/event-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/5.png', name: 'Vinnie Mostowy' },
          { avatar: '/images/avatars/6.png', name: 'Allen Rieske' },
          { avatar: '/images/avatars/7.png', name: 'Julee Rossignol' }
        ],
        description: 'profileTeamEventDescription',
        chips: [
          {
            title: 'profileChipHubilo',
            color: 'success'
          }
        ]
      },
      {
        title: 'profileTeamFigmaResources',
        avatar: '/images/logos/figma-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/1.png', name: 'Andrew Mostowy' },
          { avatar: '/images/avatars/2.png', name: 'Micky Ressula' },
          { avatar: '/images/avatars/3.png', name: 'Michel Pal' }
        ],
        description: 'profileTeamFigmaDescription',
        chips: [
          {
            title: 'profileChipUiUx',
            color: 'success'
          },
          {
            title: 'profileChipFigma',
            color: 'warning'
          }
        ]
      },
      {
        extraMembers: 8,
        title: 'profileTeamOnlyBeginners',
        avatar: '/images/logos/html-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/5.png', name: 'Kim Karlos' },
          { avatar: '/images/avatars/6.png', name: 'Katy Turner' },
          { avatar: '/images/avatars/7.png', name: 'Peter Adward' }
        ],
        description: 'profileTeamBeginnersDescription',
        chips: [
          {
            title: 'profileChipCss',
            color: 'info'
          },
          {
            title: 'profileChipHtml',
            color: 'primary'
          }
        ]
      },
      {
        title: 'profileTeamPythonDevelopers',
        avatar: '/images/logos/python-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/5.png', name: 'Kim Karlos' },
          { avatar: '/images/avatars/6.png', name: 'Katy Turner' },
          { avatar: '/images/avatars/7.png', name: 'Peter Adward' }
        ],
        description: 'profileTeamPythonDescription',
        chips: [
          {
            title: 'profileChipPython',
            color: 'info'
          }
        ]
      }
    ],
    projects: [
      {
        daysLeft: 28,
        comments: 15,
        totalTask: 344,
        hours: '380/244',
        tasks: '290/344',
        budget: '$18.2k',
        completedTask: 328,
        deadline: '28/2/22',
        chipColor: 'success',
        startDate: '14/2/21',
        budgetSpent: '$24.8k',
        members: '280',
        title: 'profileProjectSocialBanners',
        client: 'profileClientChristian',
        avatar: '/images/icons/social-bg.png',
        description: 'profileProjectSocialDescription',
        avatarGroup: [
          { avatar: '/images/avatars/1.png', name: 'Vinnie Mostowy' },
          { avatar: '/images/avatars/2.png', name: 'Allen Rieske' },
          { avatar: '/images/avatars/3.png', name: 'Julee Rossignol' }
        ]
      },
      {
        daysLeft: 15,
        comments: 236,
        totalTask: 90,
        tasks: '12/90',
        hours: '98/135',
        budget: '$1.8k',
        completedTask: 38,
        deadline: '21/6/22',
        budgetSpent: '$2.4k',
        chipColor: 'warning',
        startDate: '18/8/21',
        members: '1100',
        title: 'profileProjectAdminTemplate',
        client: 'profileClientJeffrey',
        avatar: '/images/logos/react-bg.png',
        avatarGroup: [
          { avatar: '/images/avatars/4.png', name: "Kaith D'souza" },
          { avatar: '/images/avatars/5.png', name: 'John Doe' },
          { avatar: '/images/avatars/6.png', name: 'Alan Walker' }
        ],
        description: 'profileProjectTimeDescription'
      },
      {
        daysLeft: 45,
        comments: 98,
        budget: '$420',
        totalTask: 140,
        tasks: '22/140',
        hours: '880/421',
        completedTask: 95,
        chipColor: 'error',
        budgetSpent: '$980',
        deadline: '8/10/21',
        title: 'profileProjectAppDesign',
        startDate: '24/7/21',
        members: '458',
        client: 'profileClientRicky',
        avatar: '/images/logos/vue-bg.png',
        description: 'profileProjectAppDesignDescription',
        avatarGroup: [
          { avatar: '/images/avatars/7.png', name: 'Jimmy Ressula' },
          { avatar: '/images/avatars/8.png', name: 'Kristi Lawker' },
          { avatar: '/images/avatars/1.png', name: 'Danny Paul' }
        ]
      },
      {
        comments: 120,
        daysLeft: 126,
        totalTask: 420,
        budget: '2.43k',
        tasks: '237/420',
        hours: '380/820',
        completedTask: 302,
        deadline: '12/9/22',
        budgetSpent: '$8.5k',
        chipColor: 'warning',
        startDate: '10/2/19',
        members: '137',
        client: 'profileClientHulda',
        title: 'profileProjectCreateWebsite',
        avatar: '/images/logos/html-bg.png',
        description: 'profileProjectWebsiteDescription',
        avatarGroup: [
          { avatar: '/images/avatars/2.png', name: 'Andrew Tye' },
          { avatar: '/images/avatars/3.png', name: 'Rishi Swaat' },
          { avatar: '/images/avatars/4.png', name: 'Rossie Kim' }
        ]
      },
      {
        daysLeft: 5,
        comments: 20,
        totalTask: 285,
        tasks: '29/285',
        budget: '28.4k',
        hours: '142/420',
        chipColor: 'error',
        completedTask: 100,
        deadline: '25/12/21',
        startDate: '12/12/20',
        members: '82',
        budgetSpent: '$52.7k',
        client: 'profileClientJerry',
        title: 'profileProjectFigmaDashboard',
        avatar: '/images/logos/figma-bg.png',
        description: 'profileProjectTimeDescription',
        avatarGroup: [
          { avatar: '/images/avatars/5.png', name: 'Kim Merchent' },
          { avatar: '/images/avatars/6.png', name: "Sam D'souza" },
          { avatar: '/images/avatars/7.png', name: 'Nurvi Karlos' }
        ]
      },
      {
        daysLeft: 4,
        comments: 98,
        budget: '$655',
        totalTask: 290,
        tasks: '29/290',
        hours: '580/445',
        completedTask: 290,
        budgetSpent: '$1.3k',
        chipColor: 'success',
        deadline: '02/11/21',
        startDate: '17/8/21',
        title: 'profileProjectLogoDesign',
        members: '16',
        client: 'profileClientOlive',
        avatar: '/images/logos/xd-bg.png',
        description: 'profileProjectLogoDescription',
        avatarGroup: [
          { avatar: '/images/avatars/8.png', name: 'Kim Karlos' },
          { avatar: '/images/avatars/1.png', name: 'Katy Turner' },
          { avatar: '/images/avatars/2.png', name: 'Peter Adward' }
        ]
      }
    ],
    connections: [
      {
        tasks: '834',
        projects: '18',
        isConnected: true,
        connections: '129',
        name: 'Mark Gilbert',
        designation: 'profileDesignationUiDesigner',
        avatar: '/images/avatars/1.png',
        chips: [
          {
            title: 'profileChipFigmaValue',
            color: 'secondary'
          },
          {
            title: 'profileChipSketchValue',
            color: 'warning'
          }
        ]
      },
      {
        tasks: '2.31k',
        projects: '112',
        isConnected: false,
        connections: '1.28k',
        name: 'Eugenia Parsons',
        designation: 'profileDesignationDeveloper',
        avatar: '/images/avatars/2.png',
        chips: [
          {
            color: 'error',
            title: 'profileChipAngular'
          },
          {
            color: 'info',
            title: 'profileTechnologyReactChip'
          }
        ]
      },
      {
        tasks: '1.25k',
        projects: '32',
        isConnected: false,
        connections: '890',
        name: 'Francis Byrd',
        designation: 'profileDesignationDeveloper',
        avatar: '/images/avatars/3.png',
        chips: [
          {
            title: 'profileChipHtmlValue',
            color: 'primary'
          },
          {
            color: 'info',
            title: 'profileTechnologyReactChip'
          }
        ]
      },
      {
        tasks: '12.4k',
        projects: '86',
        isConnected: false,
        connections: '890',
        name: 'Leon Lucas',
        designation: 'profileDesignationUiUxDesigner',
        avatar: '/images/avatars/4.png',
        chips: [
          {
            title: 'profileChipFigmaValue',
            color: 'secondary'
          },
          {
            title: 'profileChipSketchValue',
            color: 'warning'
          },
          {
            color: 'primary',
            title: 'profileChipPhotoshop'
          }
        ]
      },
      {
        tasks: '23.8k',
        projects: '244',
        isConnected: true,
        connections: '2.14k',
        name: 'Jayden Rogers',
        designation: 'profileDesignationFullStackDeveloper',
        avatar: '/images/avatars/5.png',
        chips: [
          {
            color: 'info',
            title: 'profileTechnologyReactChip'
          },
          {
            title: 'profileChipHtmlValue',
            color: 'warning'
          },
          {
            color: 'success',
            title: 'profileTechnologyNode'
          }
        ]
      },
      {
        tasks: '1.28k',
        projects: '32',
        isConnected: false,
        designation: 'profileDesignationSeo',
        connections: '1.27k',
        name: 'Jeanette Powell',
        avatar: '/images/avatars/6.png',
        chips: [
          {
            title: 'profileChipAnalysis',
            color: 'secondary'
          },
          {
            color: 'success',
            title: 'profileChipWriting'
          }
        ]
      }
    ]
  },
  profileHeader: {
    fullName: 'John Doe',
    location: 'profileLocationVaticanCity',
    joiningDate: 'profileJoiningDate',
    designation: 'profileDesignationUxDesigner',
    profileImg: '/images/avatars/1.png',
    designationIcon: 'tabler-palette',
    coverImg: '/images/pages/profile-banner.png'
  }
}
