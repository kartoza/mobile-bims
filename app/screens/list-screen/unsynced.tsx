import React, {useEffect, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import {View, Text, TextStyle, Alert} from 'react-native';
import {Button, Header, Icon} from '@rneui/themed';
import {styles} from '../form-screen/styles';
import {ViewStyle} from 'react-native';
import {spacing} from '../../theme/spacing';
import {palette} from '../../theme/palette';
import {fontStyles} from '../../theme/font';
import {
  getSiteVisitsByField,
  removeSiteVisitByField,
} from '../../models/site_visit/site_visit.store';
import {
  getSassSiteVisitByField,
  removeSassSiteVisitByField,
} from '../../models/sass/sass.store';
import {getSitesByField, removeSiteByField} from '../../models/site/site.store';
import Site from '../../models/site/site';
import SiteVisit from '../../models/site_visit/site_visit';
import SassSiteVisit from '../../models/sass/sass_site_visit';
import {ScrollView} from 'react-native-gesture-handler';

export interface UnsyncedScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

interface UnsyncedInterface {
  id: number | undefined;
  type: 'site' | 'sass' | 'site_visit';
  name: string;
  desc?: string;
  created: Date;
}

interface UnsyncedItemInterface extends UnsyncedInterface {
  onClickEdit: Function;
  onClickRemove: Function;
  loading: boolean;
}

const ITEM_CONTAINER: ViewStyle = {
  padding: spacing[3],
  borderBottomColor: '#00000030',
  borderBottomWidth: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
};

const TITLE_STYLE: TextStyle = {
  fontWeight: 'bold',
  ...fontStyles.large,
};

const SUBTITLE_STYLE: TextStyle = {
  ...fontStyles.medium,
};

const ITEM_CONTENT: ViewStyle = {
  width: '70%',
  paddingRight: spacing[3],
};

const ACTION_BUTTON: ViewStyle = {
  width: 50,
  height: 50,
  marginRight: 10,
};

const FOOTER_STYLE: ViewStyle = {
  position: 'absolute',
  left: 0,
  bottom: 0,
  width: '100%',
  height: 60,
};

const FOOTER_BUTTON_CONTAINER: ViewStyle = {
  padding: 10,
  backgroundColor: '#EEEEEE',
};

function UnsyncedItem(props: UnsyncedItemInterface) {
  return (
    <View style={ITEM_CONTAINER}>
      <View style={ITEM_CONTENT}>
        <Text style={TITLE_STYLE}>{props.name}</Text>
        <Text style={SUBTITLE_STYLE}>
          {props.created ? props.created?.toDateString() : '-'}
        </Text>
        <Text style={SUBTITLE_STYLE}>{props.desc}</Text>
      </View>
      <Button
        disabled={props.loading}
        buttonStyle={{...ACTION_BUTTON, backgroundColor: palette.angry}}
        onPress={e => props.onClickRemove(props.id, props.type)}>
        <Icon
          name="trash"
          color={palette.white}
          type="font-awesome"
          size={25}
        />
      </Button>
      <Button
        buttonStyle={ACTION_BUTTON}
        disabled={props.loading}
        onPress={e => props.onClickEdit(props.id, props.type)}>
        <Icon
          name="pencil"
          color={palette.white}
          type="font-awesome"
          size={25}
        />
      </Button>
    </View>
  );
}

export const UnsyncedScreen: React.FunctionComponent<
  UnsyncedScreenProps
> = props => {
  // @ts-ignore
  const {route} = props;
  const [unsynced, setUnsynced] = useState<UnsyncedInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const parseSiteDesc = (siteData: Site) => {
    const siteCode = siteData.siteCode
      ? 'Site Code : ' + siteData.siteCode + '\n'
      : '';
    return siteCode + 'Site Desc : ' + (siteData.description ? siteData.description : '-');
  };

  const parseSiteVisitDesc = (siteVisit: SiteVisit) => {
    const locationSite = siteVisit.site.siteCode
      ? siteVisit.site.siteCode
      : siteVisit.site.description;
    return 'Location Site : ' + locationSite + ' Module : ' + siteVisit.taxonGroup.name;
  };

  const parseSassSiteVisitDesc = async (sassSiteVisit: SassSiteVisit) => {
    const locationSites = await getSitesByField('id', sassSiteVisit.siteId);
    const locationSite = locationSites[0];
    const siteCode = locationSite.siteCode
      ? locationSite.siteCode
      : locationSite.description;
    return 'Location Site : ' + siteCode;
  };

  const getUnsyncedData = async () => {
    setLoading(true);
    const _unsynced: UnsyncedInterface[] = [];
    const unsyncedSites = (await getSitesByField('synced', false)) || [];
    const unsyncedSiteVisits =
      (await getSiteVisitsByField('synced', false)) || [];
    const unsyncedSass = (await getSassSiteVisitByField('synced', false)) || [];
    for (const unsyncedSite of unsyncedSites) {
      _unsynced.push({
        id: unsyncedSite.id,
        name: 'Location Site',
        desc: parseSiteDesc(unsyncedSite),
        type: 'site',
        created: new Date(unsyncedSite.datetime * 1000),
      });
    }
    for (const unsyncedSiteVisit of unsyncedSiteVisits) {
      _unsynced.push({
        id: unsyncedSiteVisit.id,
        name: 'Site Visit',
        desc: parseSiteVisitDesc(unsyncedSiteVisit),
        created: new Date(unsyncedSiteVisit.date),
        type: 'site_visit',
      });
    }
    for (const unsyncedSassData of unsyncedSass) {
      _unsynced.push({
        id: unsyncedSassData.id,
        name: 'SASS Data',
        desc: await parseSassSiteVisitDesc(unsyncedSassData),
        created: new Date(unsyncedSassData.date),
        type: 'sass',
      });
    }
    setUnsynced(
      _unsynced.sort((a, b) => a.created.getTime() - b.created.getTime()),
    );
    setLoading(false);
  };

  useEffect(() => {
    getUnsyncedData();
  }, []);

  const handleClickEdit = (_id: number, _type: string) => {
    if (_type === 'site') {
      props.navigation.navigate('siteForm', {
        siteId: _id,
        title: 'Edit Site',
        editMode: true,
        onBackToMap: async (newSiteId: Number | null = null) => {
          getUnsyncedData();
          return;
        },
      });
    } else if (_type === 'site_visit') {
      props.navigation.navigate('OccurrenceForm', {
        siteVisitId: _id,
        title: 'Edit Record',
        onBack: async () => {
          getUnsyncedData();
          return;
        },
      });
    } else if (_type === 'sass') {
      props.navigation.navigate('SASSForm', {
        sassId: _id,
        title: 'Edit SASS Record',
        onBack: async () => {
          getUnsyncedData();
          return;
        },
      });
    }
  };

  const handleClickRemove = async (_id: number, _type: string) => {
    Alert.alert(
      'Delete record',
      'Are you sure you want to delete this record?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            if (_type === 'sass') {
              await removeSassSiteVisitByField('id', _id);
            } else if (_type === 'site_visit') {
              await removeSiteVisitByField('id', _id);
            } else if (_type === 'site') {
              await removeSiteByField('id', _id);
            }
            getUnsyncedData();
          },
        },
      ],
    );
  };

  const goToPreviousScreen = React.useMemo(
    () =>
      async (sync: boolean = false) => {
        props.navigation.pop();
        if (typeof route.params.onBack !== 'undefined') {
          await route.params.onBack();
        }
        if (sync) {
          await route.params.syncRecord();
        }
      },
    [props.navigation, route.params],
  );

  const handleClickSync = () => {
    Alert.alert(
      'Sync Records',
      'Are you sure you want to sync these records?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Sync',
          onPress: () => {
            goToPreviousScreen(true);
          },
        },
      ],
    );
  };

  return (
    <View style={{minHeight: '100%', marginBottom: 100}}>
      <Header
        placement="center"
        leftComponent={{
          icon: 'chevron-left',
          type: 'font-awesome',
          color: '#fff',
          onPress: () => goToPreviousScreen(false),
        }}
        centerComponent={{
          text: 'Unsynced Data',
          style: {fontSize: 18, color: '#fff', fontWeight: 'bold'},
        }}
        containerStyle={styles.HEADER_CONTAINER}
      />
      <ScrollView style={{ marginBottom: 60, height: 1 }}>
        {unsynced.map((_unsynced: UnsyncedInterface, index: number) => (
          <UnsyncedItem
            key={'unsynced_' + index}
            name={_unsynced.name}
            desc={_unsynced.desc}
            id={_unsynced.id}
            created={_unsynced.created}
            type={_unsynced.type}
            onClickEdit={handleClickEdit}
            onClickRemove={handleClickRemove}
            loading={loading}
          />
        ))}
      </ScrollView>
      <View style={FOOTER_STYLE}>
        <View style={FOOTER_BUTTON_CONTAINER}>
          <Button
            disabled={unsynced.length == 0}
            color={'warning'}
            onPress={handleClickSync}>
            Sync Records
          </Button>
        </View>
      </View>
    </View>
  );
};
